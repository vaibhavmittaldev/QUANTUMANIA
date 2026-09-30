"""
QUANTUMANIA - Phase 6 Adaptive Learning & Learner Intelligence Test Suite
Tests Learning Events, Explainable Mastery, Weak Topic Detection,
Prerequisite-Aware Recommendations, User Isolation, and AI Tutor Integration.
"""

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.db.base import SessionLocal
from app.db.models.user import User, Profile
from app.db.models.adaptive import LearningEventModel, TopicMasteryModel
from app.db.models.learning import LessonProgress
from app.core.security import hash_password, create_access_token
from app.schemas.adaptive import LearningEventType, LearningEventCreate
from app.services.adaptive.mastery_engine import MasteryEngine
from app.services.adaptive.event_service import EventService
from app.services.adaptive.recommendation_engine import RecommendationEngine

client = TestClient(app)


@pytest.fixture
def auth_user():
    db = SessionLocal()
    # Create unique test user
    email = f"learner_{datetime.now(timezone.utc).timestamp()}@quantum.org"
    user = User(
        email=email,
        hashed_password=hash_password("QuantumPass123!"),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = Profile(
        user_id=user.id,
        username=f"learner_{int(datetime.now(timezone.utc).timestamp())}",
        display_name="Quantum Pioneer",
        experience_level="beginner",
        total_xp=150
    )
    db.add(profile)
    db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    yield {"user": user, "token": token, "headers": headers}

    # Cleanup
    db.query(LearningEventModel).filter(LearningEventModel.user_id == user.id).delete()
    db.query(TopicMasteryModel).filter(TopicMasteryModel.user_id == user.id).delete()
    db.query(LessonProgress).filter(LessonProgress.user_id == user.id).delete()
    db.query(Profile).filter(Profile.user_id == user.id).delete()
    db.query(User).filter(User.id == user.id).delete()
    db.commit()
    db.close()


@pytest.fixture
def second_user():
    db = SessionLocal()
    email = f"other_{datetime.now(timezone.utc).timestamp()}@quantum.org"
    user = User(
        email=email,
        hashed_password=hash_password("QuantumPass123!"),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = Profile(
        user_id=user.id,
        username=f"other_{int(datetime.now(timezone.utc).timestamp())}",
        display_name="Other Learner",
        experience_level="beginner",
        total_xp=0
    )
    db.add(profile)
    db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    yield {"user": user, "token": token, "headers": headers}

    db.query(LearningEventModel).filter(LearningEventModel.user_id == user.id).delete()
    db.query(TopicMasteryModel).filter(TopicMasteryModel.user_id == user.id).delete()
    db.query(Profile).filter(Profile.user_id == user.id).delete()
    db.query(User).filter(User.id == user.id).delete()
    db.commit()
    db.close()


def test_empty_new_learner_dashboard_has_no_fake_mastery(auth_user):
    """Verifies that a brand new learner starts with 0% progress and no fabricated mastery values."""
    res = client.get("/api/v1/adaptive/dashboard", headers=auth_user["headers"])
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["overall_progress"] == 0.0
    assert data["completed_lessons_count"] == 0
    assert data["total_lessons_count"] >= 20
    assert data["weaknesses"] == []
    assert data["strengths"] == []
    assert data["learning_streak_days"] == 0

    # Ensure all topic masteries are 0 / Not Started
    for tm in data["topic_mastery"]:
        assert tm["score"] == 0.0
        assert tm["level"] == "Not Started"
        assert tm["attempts"] == 0

    # Recommendation should prioritize starting first lesson
    assert len(data["recommendations"]) >= 1
    first_rec = data["recommendations"][0]
    assert first_rec["type"] == "continue_learning"
    assert "Start First Lesson" in first_rec["title"] or "What is Quantum Computing" in first_rec["title"]


def test_record_learning_event_and_enrichment(auth_user):
    """Tests posting a learning event and verifies topic_id is enriched from lesson_id."""
    payload = {
        "event_type": "lesson_started",
        "lesson_id": "les_03_superposition",
        "metadata": {"source": "unit_test"}
    }
    res = client.post("/api/v1/adaptive/events", json=payload, headers=auth_user["headers"])
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["event_type"] == "lesson_started"
    assert data["lesson_id"] == "les_03_superposition"
    assert data["topic_id"] == "superposition"
    assert data["user_id"] == auth_user["user"].id


def test_deterministic_topic_mastery_formula(auth_user):
    """
    Tests Section 59 deterministic mastery rule:
    Higher assessment accuracy produces higher mastery score.
    """
    db = SessionLocal()
    user_id = auth_user["user"].id

    # Simulate Learner A: 8 correct out of 10 attempts on 'cnot_gate'
    for i in range(10):
        is_corr = i < 8
        EventService.record_event(
            db,
            auth_user["user"],
            LearningEventCreate(
                event_type=LearningEventType.QUESTION_ANSWERED,
                topic_id="cnot_gate",
                metadata={"is_correct": is_corr, "question_id": f"q_{i}"}
            )
        )

    score_high, conf_high, attempts_high, correct_high, _ = MasteryEngine.calculate_topic_mastery(
        db, user_id, "cnot_gate"
    )
    assert attempts_high == 10
    assert correct_high == 8
    assert conf_high >= 0.8
    assert score_high >= 30.0

    # Simulate Learner B (on 'hadamard_gate'): 2 correct out of 10 attempts
    for i in range(10):
        is_corr = i < 2
        EventService.record_event(
            db,
            auth_user["user"],
            LearningEventCreate(
                event_type=LearningEventType.QUESTION_ANSWERED,
                topic_id="hadamard_gate",
                metadata={"is_correct": is_corr, "question_id": f"q_{i}"}
            )
        )

    score_low, conf_low, attempts_low, correct_low, _ = MasteryEngine.calculate_topic_mastery(
        db, user_id, "hadamard_gate"
    )
    assert attempts_low == 10
    assert correct_low == 2
    assert score_high > score_low
    db.close()


def test_weak_topic_detection_and_remediation_recommendation(auth_user):
    """
    Verifies that repeated incorrect answers on a concept trigger weak-topic detection
    and generate a prerequisite-aware recommendation.
    """
    # Submit 3 incorrect answers for CNOT gate
    for i in range(3):
        res = client.post(
            "/api/v1/adaptive/assessment",
            json={
                "topic_id": "cnot_gate",
                "question_id": f"q_cnot_{i}",
                "is_correct": False,
                "user_answer": "Flips control instead of target"
            },
            headers=auth_user["headers"]
        )
        assert res.status_code == 200

    # Fetch dashboard to verify weak topics and recommendations
    dash_res = client.get("/api/v1/adaptive/dashboard", headers=auth_user["headers"])
    assert dash_res.status_code == 200
    data = dash_res.json()["data"]

    assert "cnot_gate" in data["weaknesses"]

    # Verify recommendations contain remediation for cnot_gate or its prerequisite
    rec_types = [r["type"] for r in data["recommendations"]]
    assert any(t in ("review_lesson", "build_circuit") for t in rec_types)
    reasons = [r["reason"] for r in data["recommendations"]]
    assert any("cnot" in r.lower() or "reinforce" in r.lower() or "prerequisite" in r.lower() for r in reasons)


def test_user_data_isolation(auth_user, second_user):
    """
    Security check: User A cannot see User B's events, mastery scores, or activity timeline.
    """
    db = SessionLocal()
    # Add an event for User A
    EventService.record_event(
        db,
        auth_user["user"],
        LearningEventCreate(
            event_type=LearningEventType.LESSON_COMPLETED,
            topic_id="qubits",
            lesson_id="les_02_bits_vs_qubits"
        )
    )
    db.close()

    # User B queries dashboard
    res_b = client.get("/api/v1/adaptive/dashboard", headers=second_user["headers"])
    assert res_b.status_code == 200
    data_b = res_b.json()["data"]

    assert data_b["user_id"] == second_user["user"].id
    assert data_b["completed_lessons_count"] == 0
    assert len(data_b["recent_activity"]) == 0


def test_ai_tutor_integration_with_learner_context(auth_user):
    """
    Verifies that Phase 5 AI Tutor receives Phase 6 learner context and adapts its guidance.
    """
    # Post query with explicit learner context having weak superposition
    payload = {
        "mode": "explain",
        "message": "How does the Hadamard gate work?",
        "circuit_context": {
            "qubits": 1,
            "depth": 1,
            "gate_count": 1,
            "gates_summary": ["H on q0 at step 0"]
        },
        "simulation_context": {
            "has_simulation": True,
            "is_stale": False,
            "probabilities": {"0": 0.5, "1": 0.5}
        },
        "learner_context": {
            "overall_progress": 15.0,
            "weak_topics": ["superposition"],
            "strengths": ["qubits"]
        }
    }

    res = client.post("/api/v1/tutor/query", json=payload, headers=auth_user["headers"])
    assert res.status_code == 200
    data = res.json()["data"]

    assert "message" in data
    # Verify adaptive learning guidance was applied in the message or context metadata
    assert data["context_used"].get("learner_context_applied") is True
    assert "Superposition" in data["message"] or "superposition" in data["message"].lower()


def test_simulation_event_tracking(auth_user):
    """
    Verifies that running a quantum simulation automatically tracks circuit simulation activity.
    """
    sim_payload = {
        "circuit": {
            "qubits": 2,
            "gates": [
                {"id": "g1", "type": "H", "target": 0, "step": 0},
                {"id": "g2", "type": "CNOT", "target": 1, "control": 0, "step": 1}
            ]
        },
        "shots": 512
    }

    res = client.post("/api/v1/quantum/simulate", json=sim_payload, headers=auth_user["headers"])
    assert res.status_code == 200

    # Verify event was persisted for auth_user
    db = SessionLocal()
    events = EventService.get_user_events(
        db,
        auth_user["user"].id,
        event_types=[LearningEventType.CIRCUIT_SIMULATED.value]
    )
    assert len(events) >= 1
    assert events[0].metadata_json.get("qubits") == 2
    assert events[0].metadata_json.get("shots") == 512
    db.close()
