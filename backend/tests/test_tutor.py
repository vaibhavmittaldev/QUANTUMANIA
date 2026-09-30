"""
QUANTUMANIA - Phase 5 AI Quantum Tutor Tests
Context building, educational modes, stale-state handling, and API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.tutor.tutor_service import TutorService
from app.services.tutor.context_builder import ContextBuilder
from app.schemas.tutor import (
    TutorRequest,
    TutorMode,
    LessonContextSchema,
    CircuitContextSchema,
    SimulationContextSchema
)

client = TestClient(app)


@pytest.fixture
def bell_state_request():
    return TutorRequest(
        mode=TutorMode.EXPLAIN,
        message="Explain this circuit",
        lesson_context=LessonContextSchema(
            lesson_id="les_03_bell_states",
            title="Creating Entanglement with Bell States",
            topic="Quantum Entanglement",
            objectives=["Understand Bell pairs", "Observe correlation"]
        ),
        circuit_context=CircuitContextSchema(
            qubits=2,
            depth=2,
            gate_count=2,
            gates_summary=["H on q0 at step 0", "CNOT ctrl=q0 tgt=q1 at step 1"]
        ),
        simulation_context=SimulationContextSchema(
            has_simulation=True,
            is_stale=False,
            shots=1000,
            probabilities={"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5},
            counts={"00": 492, "11": 508}
        )
    )


def test_context_builder_produces_structured_prompt(bell_state_request):
    """Test context builder cleanly integrates lesson, circuit, and simulation metadata"""
    prompt, meta = ContextBuilder.build_context(bell_state_request)

    assert "Creating Entanglement with Bell States" in prompt
    assert "CURRENT QUANTUM CIRCUIT" in prompt
    assert "H on q0 at step 0" in prompt
    assert "CNOT ctrl=q0 tgt=q1 at step 1" in prompt
    assert "SIMULATION RESULTS" in prompt
    assert "|00⟩: 50.0%" in prompt
    assert "|11⟩: 50.0%" in prompt
    assert meta["has_lesson"] is True
    assert meta["has_circuit"] is True
    assert meta["has_simulation"] is True
    assert meta["is_stale"] is False


@pytest.mark.anyio
async def test_tutor_explain_bell_state(bell_state_request):
    """Test tutor explain mode on Bell state (|Phi+⟩)"""
    res = await TutorService.process_request(bell_state_request)

    assert res.mode == TutorMode.EXPLAIN
    assert "Bell State" in res.message or "Entangled" in res.message
    assert "Hadamard" in res.message or "H gate" in res.message
    assert "CNOT" in res.message
    assert len(res.key_points) > 0
    assert res.next_step is not None


@pytest.mark.anyio
async def test_tutor_explain_hadamard_interference():
    """Test tutor explain on H-H destructive interference"""
    req = TutorRequest(
        mode=TutorMode.EXPLAIN,
        message="Explain this circuit",
        circuit_context=CircuitContextSchema(
            qubits=1,
            depth=2,
            gate_count=2,
            gates_summary=["H on q0 at step 0", "H on q0 at step 1"]
        ),
        simulation_context=SimulationContextSchema(
            has_simulation=True,
            is_stale=False,
            shots=500,
            probabilities={"0": 1.0, "1": 0.0},
            counts={"0": 500}
        )
    )
    res = await TutorService.process_request(req)
    assert res.mode == TutorMode.EXPLAIN
    assert "Interference" in res.message or "H² = I" in res.message
    assert "|0⟩" in res.message


@pytest.mark.anyio
async def test_tutor_requires_simulation_when_asking_about_result():
    """Verify tutor refuses to invent results when simulation has not been executed"""
    req = TutorRequest(
        mode=TutorMode.ASK,
        message="Why did I get this result?",
        circuit_context=CircuitContextSchema(
            qubits=2,
            depth=2,
            gate_count=2,
            gates_summary=["H on q0", "CNOT ctrl=q0 tgt=q1"]
        ),
        simulation_context=SimulationContextSchema(
            has_simulation=False,
            is_stale=False
        )
    )
    res = await TutorService.process_request(req)
    assert res.mode == TutorMode.ASK
    # Must instruct learner to run simulation first
    assert "Run Circuit" in res.message or "not been simulated" in res.message


@pytest.mark.anyio
async def test_tutor_stale_circuit_warning():
    """Verify tutor detects and warns learner when circuit was edited after simulation"""
    req = TutorRequest(
        mode=TutorMode.EXPLAIN,
        message="Explain this circuit",
        circuit_context=CircuitContextSchema(
            qubits=2,
            depth=3,
            gate_count=3,
            gates_summary=["H on q0", "CNOT ctrl=q0 tgt=q1", "X on q0"]
        ),
        simulation_context=SimulationContextSchema(
            has_simulation=True,
            is_stale=True,
            shots=1000,
            probabilities={"00": 0.5, "11": 0.5}
        )
    )
    res = await TutorService.process_request(req)
    assert "Notice: Circuit Modified" in res.message or "STALE" in res.message or "modified" in res.message


@pytest.mark.anyio
async def test_tutor_progressive_hints():
    """Test progressive hint levels (1=conceptual, 2=specific, 3=actionable)"""
    for lvl in [1, 2, 3]:
        req = TutorRequest(
            mode=TutorMode.HINT,
            hint_level=lvl,
            circuit_context=CircuitContextSchema(
                qubits=2,
                depth=1,
                gate_count=1,
                gates_summary=["CNOT ctrl=q0 tgt=q1"]
            ),
            simulation_context=SimulationContextSchema(has_simulation=False)
        )
        res = await TutorService.process_request(req)
        assert res.mode == TutorMode.HINT
        assert f"Level {lvl}" in res.message


@pytest.mark.anyio
async def test_tutor_analyze_circuit_catches_ineffective_cnot():
    """Test circuit diagnostic catches CNOT without prior superposition"""
    req = TutorRequest(
        mode=TutorMode.ANALYZE,
        circuit_context=CircuitContextSchema(
            qubits=2,
            depth=1,
            gate_count=1,
            gates_summary=["CNOT ctrl=q0 tgt=q1"]
        ),
        simulation_context=SimulationContextSchema(has_simulation=False)
    )
    res = await TutorService.process_request(req)
    assert res.mode == TutorMode.ANALYZE
    assert "Ineffective Entanglement" in res.message or "prior Hadamard" in res.message or "Diagnostic" in res.message


@pytest.mark.anyio
async def test_tutor_guide_suggests_next_step():
    """Test guide mode provides actionable next experimentation step"""
    req = TutorRequest(
        mode=TutorMode.GUIDE,
        circuit_context=CircuitContextSchema(
            qubits=1,
            depth=1,
            gate_count=1,
            gates_summary=["H on q0"]
        ),
        simulation_context=SimulationContextSchema(has_simulation=True)
    )
    res = await TutorService.process_request(req)
    assert res.mode == TutorMode.GUIDE
    assert "Next Recommended Experiment" in res.message or "CNOT" in res.message


@pytest.mark.anyio
async def test_tutor_explains_difference_between_probabilities_and_counts():
    """Test tutor clearly explains theoretical probability vs finite empirical shot counts"""
    req = TutorRequest(
        mode=TutorMode.ASK,
        message="Why are my measurement counts 492 and 508 when probability says exactly 50%?",
        circuit_context=CircuitContextSchema(qubits=1, depth=1, gate_count=1, gates_summary=["H on q0"]),
        simulation_context=SimulationContextSchema(
            has_simulation=True,
            shots=1000,
            probabilities={"0": 0.5, "1": 0.5},
            counts={"0": 492, "1": 508}
        )
    )
    res = await TutorService.process_request(req)
    assert "Theoretical Probability" in res.message or "Empirical Counts" in res.message
    assert "sampling" in res.message.lower() or "variance" in res.message.lower() or "shots" in res.message.lower()


def test_tutor_api_status_endpoint():
    """Test GET /api/v1/tutor/status endpoint"""
    resp = client.get("/api/v1/tutor/status")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["status"] == "ready"
    assert "explain" in data["supported_modes"]
    assert "hint" in data["supported_modes"]
    assert "ask" in data["supported_modes"]


def test_tutor_api_query_endpoint():
    """Test POST /api/v1/tutor/query HTTP endpoint"""
    payload = {
        "mode": "explain",
        "message": "Explain this circuit",
        "circuit_context": {
            "qubits": 2,
            "depth": 2,
            "gate_count": 2,
            "gates_summary": ["H on q0 at step 0", "CNOT ctrl=q0 tgt=q1 at step 1"]
        },
        "simulation_context": {
            "has_simulation": True,
            "is_stale": False,
            "shots": 1000,
            "probabilities": {"00": 0.5, "11": 0.5},
            "counts": {"00": 510, "11": 490}
        }
    }
    resp = client.post("/api/v1/tutor/query", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["mode"] == "explain"
    assert "Bell" in data["message"] or "Entangled" in data["message"]
    assert len(data["key_points"]) > 0
