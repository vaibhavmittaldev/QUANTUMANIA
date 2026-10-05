"""
Integration test suite for Quantumania QuantumLab multi-engine simulation and tools.
Verifies Qiskit Aer, Cirq, PennyLane execution, OpenQASM export, Qiskit AST sync, and circuit persistence.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_simulate_qiskit_aer():
    """Verify statevector simulation on Qiskit Aer backend."""
    bell_circuit = {
        "schema_version": "1.0.0",
        "name": "Bell State Test",
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"id": "g1", "type": "H", "target": 0, "step": 0},
            {"id": "g2", "type": "CNOT", "control": 0, "target": 1, "step": 1}
        ]
    }
    response = client.post(
        "/api/v1/quantum/simulate",
        json={"circuit": bell_circuit, "shots": 1024, "backend": "qiskit", "mode": "statevector"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    res = data["data"]
    assert res["success"] is True
    assert res["qubits"] == 2
    assert "00" in res["probabilities"]
    assert "11" in res["probabilities"]
    # Check Bell state probabilities roughly 0.5 each
    assert abs(res["probabilities"]["00"] - 0.5) < 0.05
    assert abs(res["probabilities"]["11"] - 0.5) < 0.05
    assert len(res["bloch_vectors"]) == 2


def test_simulate_cirq():
    """Verify simulation on Google Cirq backend."""
    h_circuit = {
        "schema_version": "1.0.0",
        "name": "Hadamard Cirq",
        "qubits": 1,
        "classical_bits": 1,
        "gates": [
            {"id": "g1", "type": "H", "target": 0, "step": 0}
        ]
    }
    response = client.post(
        "/api/v1/quantum/simulate",
        json={"circuit": h_circuit, "shots": 512, "backend": "cirq"}
    )
    assert response.status_code == 200
    res = response.json()["data"]
    assert res["success"] is True
    assert "0" in res["probabilities"]
    assert "1" in res["probabilities"]
    assert abs(res["probabilities"]["0"] - 0.5) < 0.05


def test_simulate_pennylane():
    """Verify simulation on Xanadu PennyLane default.qubit."""
    x_circuit = {
        "schema_version": "1.0.0",
        "name": "Pauli-X PennyLane",
        "qubits": 1,
        "classical_bits": 1,
        "gates": [
            {"id": "g1", "type": "X", "target": 0, "step": 0}
        ]
    }
    response = client.post(
        "/api/v1/quantum/simulate",
        json={"circuit": x_circuit, "shots": 256, "backend": "pennylane"}
    )
    assert response.status_code == 200
    res = response.json()["data"]
    assert res["success"] is True
    assert res["probabilities"].get("1", 0.0) > 0.99


def test_compare_frameworks():
    """Verify multi-framework numerical consistency check."""
    bell_circuit = {
        "schema_version": "1.0.0",
        "name": "Bell Comparison",
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"id": "g1", "type": "H", "target": 0, "step": 0},
            {"id": "g2", "type": "CNOT", "control": 0, "target": 1, "step": 1}
        ]
    }
    response = client.post(
        "/api/v1/quantum/compare",
        json={"circuit": bell_circuit, "frameworks": ["Qiskit", "PennyLane", "Cirq"], "shots": 1024}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["consistent"] is True
    assert len(data["discrepancies"]) == 0
    assert "Qiskit" in data["results"]
    assert "PennyLane" in data["results"]
    assert "Cirq" in data["results"]


def test_export_openqasm():
    """Verify OpenQASM 2.0 generation."""
    circuit = {
        "schema_version": "1.0.0",
        "name": "QASM Export",
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"id": "g1", "type": "H", "target": 0, "step": 0},
            {"id": "g2", "type": "CNOT", "control": 0, "target": 1, "step": 1}
        ]
    }
    response = client.post("/api/v1/quantum/to-openqasm", json=circuit)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["success"] is True
    assert "OPENQASM 2.0" in data["qasm"] or "qreg" in data["qasm"]


def test_qiskit_code_sync():
    """Verify bidirectional Qiskit Python code generation and AST parsing."""
    circuit = {
        "schema_version": "1.0.0",
        "name": "Sync Test",
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"id": "g1", "type": "H", "target": 0, "step": 0},
            {"id": "g2", "type": "CNOT", "control": 0, "target": 1, "step": 1}
        ]
    }
    # To Qiskit
    res1 = client.post("/api/v1/quantum/to-qiskit", json=circuit)
    assert res1.status_code == 200
    code = res1.json()["data"]["code"]
    assert "qc.h(0)" in code
    assert "qc.cx(0, 1)" in code

    # From Qiskit
    res2 = client.post("/api/v1/quantum/from-qiskit", json={"code": code})
    assert res2.status_code == 200
    parsed = res2.json()["data"]["circuit"]
    assert parsed["qubits"] == 2
    assert len(parsed["gates"]) == 2
    assert parsed["gates"][0]["type"] == "H"
    assert parsed["gates"][1]["type"] == "CNOT"


def test_save_and_retrieve_circuit():
    """Verify circuit persistence in database."""
    circuit = {
        "schema_version": "1.0.0",
        "name": "Saved Circuit Test",
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"id": "g1", "type": "X", "target": 0, "step": 0}
        ]
    }
    save_res = client.post(
        "/api/v1/quantum/save",
        json={"circuit": circuit, "title": "My Persisted Circuit"}
    )
    assert save_res.status_code == 200
    saved_data = save_res.json()["data"]
    circuit_id = saved_data["id"]
    assert saved_data["title"] == "My Persisted Circuit"

    # Get by ID
    get_res = client.get(f"/api/v1/quantum/circuits/{circuit_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == circuit_id

    # List saved
    list_res = client.get("/api/v1/quantum/saved")
    assert list_res.status_code == 200
    ids = [c["id"] for c in list_res.json()["data"]]
    assert circuit_id in ids


def test_circuit_hint():
    """Verify contextual pedagogical hint generation."""
    circuit = {
        "schema_version": "1.0.0",
        "name": "Bell State",
        "qubits": 2,
        "classical_bits": 2,
        "gates": []
    }
    res = client.post(
        "/api/v1/quantum/hint",
        json={"topic": "Bell State Entanglement", "circuit": circuit}
    )
    assert res.status_code == 200
    hint_text = res.json()["data"]["hint"]
    assert "Hadamard" in hint_text or "superposition" in hint_text
