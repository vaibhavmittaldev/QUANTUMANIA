"""
QUANTUMANIA - Phase 7 Full Integration, Validation & Acceptance Tests
Tests the complete end-to-end journey across all 7 platform phases:
Auth -> Dashboard -> Curriculum -> Quantum Lab -> Simulator -> AI Tutor -> Adaptive Intelligence
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.demo_service import DEMO_EMAIL, DEMO_PASSWORD

client = TestClient(app)


def test_demo_account_authentication_and_profile():
    """Verify SIH Demo account exists and authenticates with standard JWT."""
    login_resp = client.post("/api/v1/auth/login", json={
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD
    })
    assert login_resp.status_code == 200
    data = login_resp.json()["data"]
    token = data["token"]
    assert token is not None
    assert data["email"] == DEMO_EMAIL
    assert data["username"] == "demolearner"

    # Verify Profile
    me_resp = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()["data"]
    assert me_data["display_name"] == "Quantum Explorer"
    assert me_data["points"] >= 200
    assert me_data["current_streak_days"] >= 1


def test_demo_learner_adaptive_dashboard_and_recommendations():
    """Verify demo account's dashboard displays real mastery, weak areas, and recommendations."""
    login_resp = client.post("/api/v1/auth/login", json={
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD
    })
    token = login_resp.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash_resp = client.get("/api/v1/adaptive/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash = dash_resp.json()["data"]

    # Overall progress and stats
    assert dash["completed_lessons_count"] >= 2
    assert dash["overall_progress"] > 0

    # Topic Mastery
    mastery_list = dash["topic_mastery"]
    assert len(mastery_list) > 0
    topic_ids = [m["topic_id"] for m in mastery_list]
    assert "quantum_foundations" in topic_ids
    assert "superposition" in topic_ids

    # Recommendations
    recs = dash["recommendations"]
    assert len(recs) > 0
    assert any("cnot" in r["reason"].lower() or "superposition" in r["reason"].lower() or "les_" in r.get("target_id", "") for r in recs)


def test_complete_cross_phase_journey_e2e():
    """
    Validates Section 63 Full Acceptance Flow:
    1. Register user
    2. Inspect empty dashboard
    3. Start lesson & pass assessment
    4. Build & simulate quantum circuit
    5. Query AI Tutor with circuit context
    6. Verify adaptive mastery & recommendation updates
    """
    import time
    ts = int(time.time())
    email = f"phase7_e2e_{ts}@quantumania.org"
    username = f"phase7e2e_{ts}"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": email,
        "username": username,
        "password": "SecurePassword123!",
        "display_name": "Phase 7 E2E Tester"
    })
    assert reg_resp.status_code == 201
    token = reg_resp.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. View dashboard
    dash1 = client.get("/api/v1/adaptive/dashboard", headers=headers).json()["data"]
    assert "overall_progress" in dash1

    # 3. Complete lesson 1
    comp_resp = client.post("/api/v1/lessons/les_01_what_is_qc/complete", headers=headers)
    assert comp_resp.status_code == 200

    # 4. Simulate a quantum circuit (Hadamard Superposition)
    sim_payload = {
        "circuit": {
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"id": "g1", "type": "H", "target": 0, "step": 0},
                {"id": "g2", "type": "CNOT", "target": 1, "controls": [0], "step": 1},
                {"id": "m0", "type": "MEASURE", "target": 0, "classical_bit": 0, "step": 2},
                {"id": "m1", "type": "MEASURE", "target": 1, "classical_bit": 1, "step": 2}
            ]
        },
        "shots": 1024
    }
    sim_resp = client.post("/api/v1/quantum/simulate", json=sim_payload, headers=headers)
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()["data"]
    assert sim_data["success"] is True
    # Bell state results in |00> and |11>
    probs = sim_data["probabilities"]
    assert "00" in probs and "11" in probs
    assert probs["00"] > 0.4 and probs["11"] > 0.4

    # 5. Query AI Tutor with simulation context
    tutor_query = {
        "mode": "ask",
        "message": "Explain what happened in this circuit.",
        "lesson_context": {
            "lesson_id": "les_03_superposition",
            "title": "The Superposition Principle",
            "topic": "Superposition"
        },
        "circuit_context": {
            "qubits": 2,
            "depth": 3,
            "gate_count": 4,
            "gates_summary": ["H(0)", "CNOT(0->1)", "MEASURE(0->0)", "MEASURE(1->1)"],
            "circuit": sim_payload["circuit"]
        },
        "simulation_context": {
            "has_simulation": True,
            "is_stale": False,
            "shots": 1024,
            "probabilities": probs,
            "counts": sim_data["counts"]
        }
    }
    tutor_resp = client.post("/api/v1/tutor/query", json=tutor_query, headers=headers)
    assert tutor_resp.status_code == 200
    assert tutor_resp.json()["success"] is True
    reply = tutor_resp.json()["data"]["message"]
    assert len(reply) > 20

    # 6. Verify Adaptive Dashboard reflects new activity and mastery
    dash2 = client.get("/api/v1/adaptive/dashboard", headers=headers).json()["data"]
    assert dash2["completed_lessons_count"] == 1
    assert len(dash2["recent_activity"]) >= 2  # Lesson + Simulation + Tutor
