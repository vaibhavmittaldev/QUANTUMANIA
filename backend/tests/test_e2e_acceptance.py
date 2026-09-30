"""
QUANTUMANIA - Phase 6 Section 81 End-to-End Acceptance Test
Executes the full 12-step flow defined in Phase 6 specifications:
1. Create/login as a learner
2. Open a quantum lesson (lesson_started)
3. Complete the lesson (lesson_completed)
4. Attempt a relevant assessment (assessment activity)
5. Create a circuit in Quantum Lab
6. Run simulation (circuit_simulated)
7. Ask AI Tutor about the circuit (tutor interaction)
8. Repeat difficulty on a concept (evidence of difficulty)
9. Open learner dashboard (progress, mastery, weak areas, activity, recommendations)
10. Follow a recommendation (verify action availability)
11. Complete recommended activity (learner progress updates)
12. Ask AI Tutor again (tutor receives updated learner context)
"""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.db.base import SessionLocal
from app.db.models.user import User, Profile
from app.db.models.adaptive import LearningEventModel, TopicMasteryModel
from app.db.models.learning import LessonProgress
from app.core.security import hash_password, create_access_token
from app.schemas.adaptive import LearningEventType
from app.services.adaptive.event_service import EventService

client = TestClient(app)


def test_section_81_full_e2e_flow():
    db = SessionLocal()
    # -------------------------------------------------------------
    # Step 1: Create / Login as a learner
    # -------------------------------------------------------------
    timestamp = int(datetime.now(timezone.utc).timestamp())
    email = f"e2e_learner_{timestamp}@quantum.org"
    user = User(
        email=email,
        hashed_password=hash_password("E2EPass123!"),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = Profile(
        user_id=user.id,
        username=f"e2e_user_{timestamp}",
        display_name="E2E Quantum Candidate",
        experience_level="beginner",
        total_xp=0
    )
    db.add(profile)
    db.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    try:
        # -------------------------------------------------------------
        # Step 2: Open a quantum lesson -> verify lesson_started event
        # -------------------------------------------------------------
        lesson_id = "les_03_superposition"
        start_res = client.post(f"/api/v1/lessons/{lesson_id}/start", headers=headers)
        assert start_res.status_code == 200

        events = EventService.get_user_events(db, user.id, event_types=[LearningEventType.LESSON_STARTED.value])
        assert len(events) >= 1
        assert events[0].lesson_id == lesson_id
        assert events[0].topic_id == "superposition"

        # -------------------------------------------------------------
        # Step 3: Complete the lesson -> verify lesson_completed event
        # -------------------------------------------------------------
        complete_res = client.post(f"/api/v1/lessons/{lesson_id}/complete", headers=headers)
        assert complete_res.status_code == 200

        events_comp = EventService.get_user_events(db, user.id, event_types=[LearningEventType.LESSON_COMPLETED.value])
        assert len(events_comp) >= 1
        assert events_comp[0].lesson_id == lesson_id

        # -------------------------------------------------------------
        # Step 4: Attempt a relevant assessment -> verify assessment activity
        # -------------------------------------------------------------
        assess_res = client.post(
            "/api/v1/adaptive/assessment",
            json={
                "topic_id": "superposition",
                "question_id": "q_sup_1",
                "is_correct": True,
                "user_answer": "|+> = (|0> + |1>)/sqrt(2)",
                "score": 100.0
            },
            headers=headers
        )
        assert assess_res.status_code == 200
        mastery_data = assess_res.json()["data"]
        assert mastery_data["topic_id"] == "superposition"
        assert mastery_data["correct_attempts"] >= 1

        # -------------------------------------------------------------
        # Step 5 & 6: Create & simulate circuit in Quantum Lab
        # -------------------------------------------------------------
        sim_payload = {
            "circuit": {
                "qubits": 2,
                "gates": [
                    {"id": "g1", "type": "H", "target": 0, "step": 0},
                    {"id": "g2", "type": "CNOT", "target": 1, "control": 0, "step": 1}
                ]
            },
            "shots": 1024
        }
        sim_res = client.post("/api/v1/quantum/simulate", json=sim_payload, headers=headers)
        assert sim_res.status_code == 200

        sim_events = EventService.get_user_events(db, user.id, event_types=[LearningEventType.CIRCUIT_SIMULATED.value])
        assert len(sim_events) >= 1
        assert sim_events[0].metadata_json.get("qubits") == 2

        # -------------------------------------------------------------
        # Step 7: Ask AI Tutor about the circuit -> verify tutor interaction
        # -------------------------------------------------------------
        tutor_payload = {
            "mode": "ask",
            "message": "Why do only 00 and 11 appear with 50% probability each?",
            "circuit_context": {
                "qubits": 2,
                "depth": 2,
                "gate_count": 2,
                "gates_summary": ["H on q0 at step 0", "CNOT on q1 (ctrl=q0) at step 1"]
            },
            "simulation_context": {
                "has_simulation": True,
                "is_stale": False,
                "probabilities": {"00": 0.5, "11": 0.5}
            }
        }
        tutor_res = client.post("/api/v1/tutor/query", json=tutor_payload, headers=headers)
        assert tutor_res.status_code == 200
        assert "message" in tutor_res.json()["data"]

        tutor_events = EventService.get_user_events(db, user.id, event_types=[LearningEventType.TUTOR_QUESTION.value])
        assert len(tutor_events) >= 1

        # -------------------------------------------------------------
        # Step 8: Repeat difficulty on a concept (e.g. CNOT gate)
        # -------------------------------------------------------------
        for i in range(3):
            client.post(
                "/api/v1/adaptive/assessment",
                json={
                    "topic_id": "cnot_gate",
                    "question_id": f"q_cnot_diff_{i}",
                    "is_correct": False,
                    "user_answer": "Inverts control instead of target"
                },
                headers=headers
            )

        # Also request tutor hints on cnot_gate
        client.post(
            "/api/v1/adaptive/events",
            json={
                "event_type": "tutor_hint",
                "topic_id": "cnot_gate",
                "metadata": {"hint_level": 2}
            },
            headers=headers
        )

        # -------------------------------------------------------------
        # Step 9: Open learner dashboard -> verify verified data
        # -------------------------------------------------------------
        dash_res = client.get("/api/v1/adaptive/dashboard", headers=headers)
        assert dash_res.status_code == 200
        dashboard = dash_res.json()["data"]

        assert dashboard["overall_progress"] > 0.0
        assert dashboard["completed_lessons_count"] == 1
        assert "cnot_gate" in dashboard["weaknesses"]
        assert len(dashboard["recent_activity"]) >= 4
        assert len(dashboard["recommendations"]) >= 1

        # -------------------------------------------------------------
        # Step 10: Follow a recommendation -> verify availability
        # -------------------------------------------------------------
        first_rec = dashboard["recommendations"][0]
        assert first_rec["action_url"].startswith("/app/")
        assert len(first_rec["reason"]) > 0

        # -------------------------------------------------------------
        # Step 11: Complete the recommended activity (e.g. les_04_measurement)
        # -------------------------------------------------------------
        next_les = "les_04_measurement"
        comp2 = client.post(f"/api/v1/lessons/{next_les}/complete", headers=headers)
        assert comp2.status_code == 200

        dash2 = client.get("/api/v1/adaptive/dashboard", headers=headers).json()["data"]
        assert dash2["completed_lessons_count"] == 2
        assert dash2["overall_progress"] > dashboard["overall_progress"]

        # -------------------------------------------------------------
        # Step 12: Ask AI Tutor again -> verify tutor receives updated learner context
        # -------------------------------------------------------------
        tutor2_payload = {
            "mode": "explain",
            "message": "Explain how measurement affects entangled qubits",
            "circuit_context": {
                "qubits": 2,
                "depth": 2,
                "gate_count": 2,
                "gates_summary": ["H on q0", "CNOT on q1 (ctrl=q0)"]
            },
            "simulation_context": {
                "has_simulation": True,
                "is_stale": False,
                "probabilities": {"00": 0.5, "11": 0.5}
            }
        }
        tutor2_res = client.post("/api/v1/tutor/query", json=tutor2_payload, headers=headers)
        assert tutor2_res.status_code == 200
        tutor2_data = tutor2_res.json()["data"]
        # Context used confirms learner context was applied
        assert tutor2_data["context_used"].get("learner_context_applied") is True
        assert tutor2_data["context_used"].get("learner_overall_progress") >= 10.0

    finally:
        # Cleanup
        db.query(LearningEventModel).filter(LearningEventModel.user_id == user.id).delete()
        db.query(TopicMasteryModel).filter(TopicMasteryModel.user_id == user.id).delete()
        db.query(LessonProgress).filter(LessonProgress.user_id == user.id).delete()
        db.query(Profile).filter(Profile.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()
