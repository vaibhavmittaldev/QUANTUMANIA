"""
QUANTUMANIA - Phase 4 Quantum Simulator Tests
Mathematical accuracy, gate operations, multi-qubit entanglement, and API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.simulation_service import SimulationService
from app.schemas.circuit import (
    CanonicalCircuitSchema,
    QuantumGateSchema,
    GateType
)

client = TestClient(app)


def test_simulate_x_gate():
    """Test Pauli-X bit flip: |0⟩ -> |1⟩ with P(1) = 1.0"""
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=1,
        classical_bits=1,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.X, target=0, step=0)
        ]
    )
    res = SimulationService.simulate(circuit, shots=1000)
    assert res.success is True
    assert res.qubits == 1 if hasattr(res, "qubits") else True
    assert res.probabilities["1"] == pytest.approx(1.0, abs=1e-5)
    assert res.probabilities.get("0", 0.0) == pytest.approx(0.0, abs=1e-5)
    assert res.counts.get("1") == 1000


def test_simulate_hadamard_gate():
    """Test Hadamard superposition: |0⟩ -> (|0⟩ + |1⟩)/√2"""
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=1,
        classical_bits=1,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.H, target=0, step=0)
        ]
    )
    res = SimulationService.simulate(circuit, shots=1000)
    assert res.success is True
    assert res.probabilities["0"] == pytest.approx(0.5, abs=1e-5)
    assert res.probabilities["1"] == pytest.approx(0.5, abs=1e-5)
    # Sum of counts equals total shots
    assert res.counts["0"] + res.counts["1"] == 1000
    # Statistical tolerance for 1000 shots
    assert 400 <= res.counts["0"] <= 600
    assert 400 <= res.counts["1"] <= 600


def test_simulate_hadamard_destructive_interference():
    """Test H · H = I (two consecutive Hadamards return |0⟩)"""
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=1,
        classical_bits=1,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.H, target=0, step=0),
            QuantumGateSchema(id="g2", type=GateType.H, target=0, step=1)
        ]
    )
    res = SimulationService.simulate(circuit, shots=100)
    assert res.success is True
    assert res.probabilities["0"] == pytest.approx(1.0, abs=1e-5)
    assert res.probabilities.get("1", 0.0) == pytest.approx(0.0, abs=1e-5)
    assert res.counts["0"] == 100


def test_simulate_pauli_y_gate():
    """Test Pauli-Y gate: Y|0⟩ = i|1⟩, |i|² = 1.0"""
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=1,
        classical_bits=1,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.Y, target=0, step=0)
        ]
    )
    res = SimulationService.simulate(circuit, shots=500)
    assert res.success is True
    assert res.probabilities["1"] == pytest.approx(1.0, abs=1e-5)
    amp1 = [entry for entry in res.statevector if entry.basis == "1"][0]
    assert amp1.imag == pytest.approx(1.0, abs=1e-5)


def test_simulate_pauli_z_gate():
    """Test Pauli-Z gate: Z|0⟩ = |0⟩"""
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=1,
        classical_bits=1,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.Z, target=0, step=0)
        ]
    )
    res = SimulationService.simulate(circuit, shots=200)
    assert res.success is True
    assert res.probabilities["0"] == pytest.approx(1.0, abs=1e-5)


def test_simulate_s_and_t_phase_gates():
    """Test S gate (pi/2) and T gate (pi/4) phase rotation"""
    # H then S: phase of |1⟩ should be pi/2 (~1.570796)
    circuit_s = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=1,
        classical_bits=1,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.H, target=0, step=0),
            QuantumGateSchema(id="g2", type=GateType.S, target=0, step=1)
        ]
    )
    res_s = SimulationService.simulate(circuit_s, shots=100)
    assert res_s.success is True
    assert res_s.probabilities["0"] == pytest.approx(0.5, abs=1e-4)
    assert res_s.probabilities["1"] == pytest.approx(0.5, abs=1e-4)
    amp_s1 = [e for e in res_s.statevector if e.basis == "1"][0]
    assert amp_s1.phase_rad == pytest.approx(1.570796, abs=1e-4)

    # H then T: phase of |1⟩ should be pi/4 (~0.785398)
    circuit_t = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=1,
        classical_bits=1,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.H, target=0, step=0),
            QuantumGateSchema(id="g2", type=GateType.T, target=0, step=1)
        ]
    )
    res_t = SimulationService.simulate(circuit_t, shots=100)
    assert res_t.success is True
    amp_t1 = [e for e in res_t.statevector if e.basis == "1"][0]
    assert amp_t1.phase_rad == pytest.approx(0.785398, abs=1e-4)


def test_simulate_cnot_basis_states():
    """
    Test all 2-qubit computational basis states under CNOT(control=q0, target=q1).
    Little-Endian: bitstring = "q1 q0"
    |00⟩ -> |00⟩
    |01⟩ -> |11⟩
    |10⟩ -> |10⟩
    |11⟩ -> |01⟩
    """
    # Case 1: |00⟩
    c00 = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.CNOT, control=0, target=1, step=0)
        ]
    )
    res00 = SimulationService.simulate(c00, shots=100)
    assert res00.probabilities["00"] == pytest.approx(1.0, abs=1e-5)

    # Case 2: |01⟩ (X on q0, then CNOT(q0, q1) -> flips q1 to 1 -> "11")
    c01 = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.X, target=0, step=0),
            QuantumGateSchema(id="g2", type=GateType.CNOT, control=0, target=1, step=1)
        ]
    )
    res01 = SimulationService.simulate(c01, shots=100)
    assert res01.probabilities["11"] == pytest.approx(1.0, abs=1e-5)

    # Case 3: |10⟩ (X on q1, then CNOT(q0, q1) -> q0 is 0 so q1 unchanged -> "10")
    c10 = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.X, target=1, step=0),
            QuantumGateSchema(id="g2", type=GateType.CNOT, control=0, target=1, step=1)
        ]
    )
    res10 = SimulationService.simulate(c10, shots=100)
    assert res10.probabilities["10"] == pytest.approx(1.0, abs=1e-5)

    # Case 4: |11⟩ (X on q0 and q1, then CNOT(q0, q1) -> q1 flips 1 to 0 -> "01")
    c11 = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.X, target=0, step=0),
            QuantumGateSchema(id="g2", type=GateType.X, target=1, step=0),
            QuantumGateSchema(id="g3", type=GateType.CNOT, control=0, target=1, step=1)
        ]
    )
    res11 = SimulationService.simulate(c11, shots=100)
    assert res11.probabilities["01"] == pytest.approx(1.0, abs=1e-5)


def test_simulate_bell_state():
    """
    Test Bell State |Phi+⟩: H(q0), CNOT(q0 -> q1)
    Expected probabilities: P(00) = 0.5, P(11) = 0.5, P(01) = 0, P(10) = 0
    """
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.H, target=0, step=0),
            QuantumGateSchema(id="g2", type=GateType.CNOT, control=0, target=1, step=1)
        ]
    )
    res = SimulationService.simulate(circuit, shots=1000)
    assert res.success is True
    assert res.probabilities["00"] == pytest.approx(0.5, abs=1e-4)
    assert res.probabilities["11"] == pytest.approx(0.5, abs=1e-4)
    assert res.probabilities.get("01", 0.0) == pytest.approx(0.0, abs=1e-4)
    assert res.probabilities.get("10", 0.0) == pytest.approx(0.0, abs=1e-4)

    # Sum of counts equals shots
    assert res.counts["00"] + res.counts["11"] == 1000
    assert 400 <= res.counts["00"] <= 600
    assert 400 <= res.counts["11"] <= 600


def test_simulate_normalization():
    """Verify sum of probabilities is always exactly 1.0 across all basis states"""
    circuit = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=3,
        classical_bits=3,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.H, target=0, step=0),
            QuantumGateSchema(id="g2", type=GateType.H, target=1, step=0),
            QuantumGateSchema(id="g3", type=GateType.CNOT, control=0, target=2, step=1)
        ]
    )
    res = SimulationService.simulate(circuit, shots=100)
    assert res.success is True
    total_prob = sum(res.probabilities.values())
    assert total_prob == pytest.approx(1.0, abs=1e-5)


def test_simulate_invalid_circuit_rejected():
    """Verify circuits with validation violations fail explicitly"""
    # CNOT with identical control and target
    invalid_cnot = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.CNOT, control=0, target=0, step=0)
        ]
    )
    res = SimulationService.simulate(invalid_cnot)
    assert res.success is False
    assert "cannot be identical" in res.error

    # Target out of bounds
    invalid_target = CanonicalCircuitSchema(
        schema_version="1.0.0",
        qubits=2,
        classical_bits=2,
        gates=[
            QuantumGateSchema(id="g1", type=GateType.X, target=5, step=0)
        ]
    )
    res_tgt = SimulationService.simulate(invalid_target)
    assert res_tgt.success is False
    assert "out of bounds" in res_tgt.error


def test_simulate_api_endpoint():
    """Test POST /api/v1/quantum/simulate HTTP endpoint"""
    payload = {
        "circuit": {
            "schema_version": "1.0.0",
            "name": "Bell State Test",
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"id": "g1", "type": "H", "target": 0, "step": 0},
                {"id": "g2", "type": "CNOT", "control": 0, "target": 1, "step": 1}
            ]
        },
        "shots": 1024
    }

    response = client.post("/api/v1/quantum/simulate", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["shots"] == 1024
    assert data["probabilities"]["00"] == pytest.approx(0.5, abs=1e-4)
    assert data["probabilities"]["11"] == pytest.approx(0.5, abs=1e-4)
    assert "00" in data["counts"]
    assert "11" in data["counts"]
    assert len(data["statevector"]) == 4
    assert len(data["bloch_vectors"]) == 2
