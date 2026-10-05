"""
QUANTUMANIA - Lab Practice & Validation Unit and Integration Tests
Verifies educational connection between Learning Theory -> Lab Practice -> Circuit Validation -> Progress
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db.base import get_db
from app.db.models.learning import Lesson, LabProblem, LabProgressRecord
from app.services.lab_service import LabService

client = TestClient(app)


def test_topic_without_lab_practice():
    """Verify that purely conceptual topics (e.g. les_01_what_is_qc) have 0 lab problems."""
    res = client.get("/api/v1/lessons/les_01_what_is_qc/lab-problems")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) == 0


def test_topic_with_lab_practice():
    """Verify that lab-capable topics (e.g. les_03_superposition) have structured lab problems."""
    res = client.get("/api/v1/lessons/les_03_superposition/lab-problems")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    problems = data["data"]
    assert len(problems) >= 2
    assert any(p["id"] == "lab_superposition_01" for p in problems)
    super_prob = next(p for p in problems if p["id"] == "lab_superposition_01")
    assert super_prob["title"] == "Create a Superposition State"
    assert super_prob["difficulty"] == "beginner"
    assert super_prob["xp_reward"] == 50


def test_get_lab_problem_detail():
    """Verify retrieval of detailed instructions, starter template, and hints."""
    res = client.get("/api/v1/lab-problems/lab_superposition_01")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    prob = data["data"]
    assert prob["id"] == "lab_superposition_01"
    assert len(prob["instructions"]) >= 3
    assert len(prob["hints"]) >= 2
    assert "H" in prob["required_gates"]
    assert "target_states" in prob["validation_rules"]


def test_validate_superposition_correct():
    """Verify that a valid superposition circuit (H on q0) with ~50/50 distribution passes validation."""
    valid_circuit = {
        "qubits": 1,
        "classical_bits": 1,
        "gates": [{"type": "H", "target": 0, "step": 0}],
        "measurements": [{"qubit": 0, "classical_bit": 0}]
    }
    sim_result = {
        "probabilities": {"0": 0.49, "1": 0.51},
        "counts": {"0": 502, "1": 522},
        "shots": 1024
    }

    res = client.post(
        "/api/v1/lab-problems/lab_superposition_01/validate",
        json={"circuit": valid_circuit, "simulation_result": sim_result}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    val = data["data"]
    assert val["passed"] is True
    assert val["is_valid"] is True
    assert val["score"] == 100.0
    assert "Completed" in val["message"]


def test_validate_superposition_incorrect_missing_gate():
    """Verify that a circuit missing the required Hadamard gate fails validation."""
    invalid_circuit = {
        "qubits": 1,
        "classical_bits": 1,
        "gates": [{"type": "X", "target": 0, "step": 0}],
        "measurements": [{"qubit": 0, "classical_bit": 0}]
    }
    sim_result = {
        "probabilities": {"1": 1.0},
        "counts": {"1": 1024},
        "shots": 1024
    }

    res = client.post(
        "/api/v1/lab-problems/lab_superposition_01/validate",
        json={"circuit": invalid_circuit, "simulation_result": sim_result}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    val = data["data"]
    assert val["passed"] is False
    assert val["is_valid"] is False
    assert any("Required Gate: H" in c["name"] and not c["passed"] for c in val["checks"])


def test_validate_bell_state_correct():
    """Verify that Bell state |Φ+⟩ with H and CNOT passes."""
    bell_circuit = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"type": "H", "target": 0, "step": 0},
            {"type": "CNOT", "control": 0, "target": 1, "step": 1}
        ],
        "measurements": [
            {"qubit": 0, "classical_bit": 0},
            {"qubit": 1, "classical_bit": 1}
        ]
    }
    sim_result = {
        "probabilities": {"00": 0.505, "11": 0.495},
        "counts": {"00": 517, "11": 507},
        "shots": 1024
    }

    res = client.post(
        "/api/v1/lab-problems/lab_bell_state_01/validate",
        json={"circuit": bell_circuit, "simulation_result": sim_result}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    val = data["data"]
    assert val["passed"] is True
    assert val["is_valid"] is True
    assert val["score"] == 100.0


def test_validate_bell_state_forbidden_states():
    """Verify that an entangled Bell state fails if unentangled cross-terms (|01⟩, |10⟩) appear."""
    bad_bell = {
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"type": "H", "target": 0, "step": 0},
            {"type": "H", "target": 1, "step": 0}
        ],
        "measurements": [
            {"qubit": 0, "classical_bit": 0},
            {"qubit": 1, "classical_bit": 1}
        ]
    }
    sim_result = {
        "probabilities": {"00": 0.25, "01": 0.25, "10": 0.25, "11": 0.25},
        "counts": {"00": 256, "01": 256, "10": 256, "11": 256},
        "shots": 1024
    }

    res = client.post(
        "/api/v1/lab-problems/lab_bell_state_01/validate",
        json={"circuit": bad_bell, "simulation_result": sim_result}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    val = data["data"]
    assert val["passed"] is False
    assert val["is_valid"] is False
    assert any("Distribution mismatch" in c["message"] for c in val["checks"])
