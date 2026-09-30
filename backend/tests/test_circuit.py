"""
QUANTUMANIA - Phase 3 Quantum Circuit Validation Tests
Validates canonical circuit constraints and API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.circuit_service import CircuitService
from app.schemas.circuit import (
    CanonicalCircuitSchema,
    QuantumGateSchema,
    GateType,
    MeasurementMappingSchema
)

client = TestClient(app)


def test_valid_empty_circuit():
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[]
    )
    res = CircuitService.validate_circuit(circuit)
    assert res.is_valid is True
    assert len(res.errors) == 0
    assert res.depth == 0
    assert res.gate_count == 0


def test_valid_single_and_multi_qubit_circuit():
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        name="Bell State",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.H, target=0, step=0),
            QuantumGateSchema(id="g2", type=GateType.CNOT, control=0, target=1, step=1),
            QuantumGateSchema(id="g3", type=GateType.MEASURE, target=0, step=2),
            QuantumGateSchema(id="g4", type=GateType.MEASURE, target=1, step=2)
        ]
    )
    res = CircuitService.validate_circuit(circuit)
    assert res.is_valid is True
    assert len(res.errors) == 0
    assert res.depth == 3
    assert res.gate_count == 4


def test_invalid_cnot_same_control_and_target():
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.CNOT, control=0, target=0, step=0)
        ]
    )
    res = CircuitService.validate_circuit(circuit)
    assert res.is_valid is False
    assert any(e.violation == "CONTROL_EQUALS_TARGET" for e in res.errors)


def test_qubit_out_of_bounds():
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.X, target=5, step=0)
        ]
    )
    res = CircuitService.validate_circuit(circuit)
    assert res.is_valid is False
    assert any(e.violation == "QUBIT_OUT_OF_BOUNDS" for e in res.errors)


def test_control_qubit_out_of_bounds():
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.CNOT, control=4, target=1, step=0)
        ]
    )
    res = CircuitService.validate_circuit(circuit)
    assert res.is_valid is False
    assert any(e.violation == "QUBIT_OUT_OF_BOUNDS" for e in res.errors)


def test_qubit_collision_at_same_step():
    # Two gates acting on qubit 0 at step 0
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.H, target=0, step=0),
            QuantumGateSchema(id="g2", type=GateType.X, target=0, step=0)
        ]
    )
    res = CircuitService.validate_circuit(circuit)
    assert res.is_valid is False
    assert any(e.violation == "QUBIT_COLLISION" for e in res.errors)


def test_cnot_collision_with_single_gate():
    # CNOT control is 0 at step 1, but another gate also acts on qubit 0 at step 1
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.CNOT, control=0, target=1, step=1),
            QuantumGateSchema(id="g2", type=GateType.Z, target=0, step=1)
        ]
    )
    res = CircuitService.validate_circuit(circuit)
    assert res.is_valid is False
    assert any(e.violation == "QUBIT_COLLISION" for e in res.errors)


def test_max_qubits_exceeded():
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=9,
        classical_bits=2,
        gates=[]
    )
    res = CircuitService.validate_circuit(circuit)
    assert res.is_valid is False
    assert any(e.violation == "MAX_QUBITS_EXCEEDED" for e in res.errors)


def test_depth_calculation():
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.H, target=0, step=0),
            QuantumGateSchema(id="g2", type=GateType.X, target=1, step=4)
        ]
    )
    res = CircuitService.validate_circuit(circuit)
    assert res.is_valid is True
    assert res.depth == 5  # Step 4 -> depth 5


def test_api_validate_endpoint():
    payload = {
        "schema_version": "1.0.0",
        "name": "Test Circuit",
        "qubits": 2,
        "classical_bits": 2,
        "gates": [
            {"id": "op1", "type": "H", "target": 0, "step": 0},
            {"id": "op2", "type": "CNOT", "control": 0, "target": 1, "step": 1}
        ]
    }
    response = client.post("/api/v1/quantum/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["is_valid"] is True
    assert data["data"]["depth"] == 2
    assert data["data"]["gate_count"] == 2


def test_api_templates_endpoints():
    response = client.get("/api/v1/quantum/templates")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    templates = data["data"]
    assert len(templates) >= 3
    template_ids = [t["id"] for t in templates]
    assert "bell-state" in template_ids
    assert "superposition" in template_ids

    # Test single template
    bell_resp = client.get("/api/v1/quantum/templates/bell-state")
    assert bell_resp.status_code == 200
    bell_data = bell_resp.json()
    assert bell_data["success"] is True
    assert bell_data["data"]["qubits"] == 2
    assert len(bell_data["data"]["circuit"]["gates"]) == 4

    # Test 404 template
    not_found = client.get("/api/v1/quantum/templates/non-existent-template")
    assert not_found.status_code == 404
