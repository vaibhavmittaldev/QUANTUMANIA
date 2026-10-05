"""
QUANTUMANIA - Quantum Circuit & Multi-Engine Simulation Endpoints
Phase 3 & 4: Quantum Circuit Builder & Multi-Engine Simulation
Strict parity with docs/QUANTUM_SCHEMA.md & QuantumLab specification
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, status, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.base import get_db
from app.db.models.user import User
from app.db.models.circuit import CircuitModel
from app.api.deps import get_current_user_optional
from app.schemas.common import StandardSuccessResponse
from app.schemas.circuit import (
    CanonicalCircuitSchema,
    CircuitValidationResponse,
    CircuitTemplateSummary
)
from app.schemas.simulation import (
    SimulationRequest,
    SimulationResultSchema,
    CompareSimulationRequest,
    CompareSimulationResponse,
    OpenQASMExportResponse,
    SaveCircuitRequest,
    SavedCircuitResponse
)
from app.services.circuit_service import CircuitService
from app.services.simulation.engine import simulation_engine

router = APIRouter(prefix="/quantum", tags=["quantum"])


@router.post(
    "/validate",
    response_model=StandardSuccessResponse[CircuitValidationResponse],
    status_code=status.HTTP_200_OK,
    summary="Validate canonical quantum circuit against physical and architectural constraints"
)
def validate_circuit(circuit: CanonicalCircuitSchema):
    result = CircuitService.validate_circuit(circuit)
    return StandardSuccessResponse(success=True, data=result)


@router.get(
    "/templates",
    response_model=StandardSuccessResponse[List[CircuitTemplateSummary]],
    status_code=status.HTTP_200_OK,
    summary="List canonical starter circuit templates"
)
def get_templates():
    templates = CircuitService.get_templates()
    return StandardSuccessResponse(success=True, data=templates)


@router.get(
    "/templates/{template_id}",
    response_model=StandardSuccessResponse[CircuitTemplateSummary],
    status_code=status.HTTP_200_OK,
    summary="Get starter circuit template by id"
)
def get_template(template_id: str):
    template = CircuitService.get_template_by_id(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Circuit template '{template_id}' not found."
        )
    return StandardSuccessResponse(success=True, data=template)


@router.post(
    "/simulate",
    response_model=StandardSuccessResponse[SimulationResultSchema],
    status_code=status.HTTP_200_OK,
    summary="Simulate canonical quantum circuit across Qiskit Aer, Cirq, PennyLane, or Local statevector"
)
@router.post(
    "/simulation/run",
    response_model=StandardSuccessResponse[SimulationResultSchema],
    status_code=status.HTTP_200_OK,
    summary="Alias for QuantumLab simulation run compatibility"
)
async def simulate_circuit(
    payload: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    backend_name = payload.backend or "local"
    result = await simulation_engine.execute(
        payload.circuit,
        backend=backend_name,
        shots=payload.shots,
        mode=payload.mode or "statevector",
        noise_enabled=bool(payload.noise_enabled),
        step_index=payload.step_index
    )

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.error or "Simulation failed."
        )

    # Phase 6: Learning Event Tracking
    if current_user and result.success:
        try:
            from app.services.adaptive.event_service import EventService
            from app.schemas.adaptive import LearningEventCreate, LearningEventType
            from app.services.adaptive.curriculum_topics import get_topic_for_gates

            gates = [g.type.value if hasattr(g.type, "value") else str(g.type) for g in payload.circuit.gates]
            matched_topics = get_topic_for_gates(gates)
            primary_topic = matched_topics[0] if matched_topics else "circuit_simulation"

            EventService.record_event(
                db,
                current_user,
                LearningEventCreate(
                    event_type=LearningEventType.CIRCUIT_SIMULATED,
                    topic_id=primary_topic,
                    metadata={
                        "qubits": payload.circuit.qubits,
                        "gates_count": len(payload.circuit.gates),
                        "shots": payload.shots,
                        "backend": backend_name,
                        "gates": gates[:10]
                    }
                )
            )
        except Exception:
            pass

    return StandardSuccessResponse(success=True, data=result)


@router.post(
    "/compare",
    response_model=StandardSuccessResponse[CompareSimulationResponse],
    status_code=status.HTTP_200_OK,
    summary="Compare numerical simulation results across multiple quantum frameworks (Qiskit, PennyLane, Cirq)"
)
async def compare_frameworks(payload: CompareSimulationRequest):
    comparison = await simulation_engine.compare_backends(
        payload.circuit,
        frameworks=payload.frameworks,
        shots=payload.shots
    )
    return StandardSuccessResponse(
        success=True,
        data=CompareSimulationResponse(**comparison)
    )


@router.post(
    "/to-openqasm",
    response_model=StandardSuccessResponse[OpenQASMExportResponse],
    status_code=status.HTTP_200_OK,
    summary="Export canonical quantum circuit to OpenQASM 2.0 format"
)
def export_to_openqasm(circuit: CanonicalCircuitSchema):
    res = simulation_engine.export_openqasm(circuit)
    return StandardSuccessResponse(
        success=True,
        data=OpenQASMExportResponse(
            success=res.get("success", True),
            qasm=res.get("qasm", ""),
            error=res.get("error")
        )
    )


@router.post(
    "/to-qiskit",
    status_code=status.HTTP_200_OK,
    summary="Generate human-readable Qiskit Python code from canonical circuit"
)
def convert_to_qiskit(circuit: CanonicalCircuitSchema):
    code = simulation_engine.compile_to_qiskit_code(circuit)
    return StandardSuccessResponse(success=True, data={"code": code})


@router.post(
    "/from-qiskit",
    status_code=status.HTTP_200_OK,
    summary="Parse Qiskit Python code to canonical circuit for bidirectional editor sync"
)
def parse_from_qiskit(payload: Dict[str, str]):
    code = payload.get("code", "")
    circuit_dict = simulation_engine.parse_qiskit_code(code)
    return StandardSuccessResponse(success=True, data={"circuit": circuit_dict})


@router.post(
    "/save",
    response_model=StandardSuccessResponse[SavedCircuitResponse],
    status_code=status.HTTP_200_OK,
    summary="Save canonical quantum circuit to user library"
)
def save_circuit(
    payload: SaveCircuitRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    title = payload.title or payload.circuit.name or "Untitled Circuit"
    user_id = current_user.id if current_user else None

    # Check for existing circuit by title and user
    query = select(CircuitModel)
    if user_id:
        query = query.where(CircuitModel.user_id == user_id, CircuitModel.title == title)
    else:
        query = query.where(CircuitModel.title == title)

    existing = db.execute(query).scalars().first()

    canonical_data = payload.circuit.model_dump() if hasattr(payload.circuit, "model_dump") else payload.circuit.dict()
    qiskit_code = payload.qiskit_code or simulation_engine.compile_to_qiskit_code(payload.circuit)

    if existing:
        existing.qubits = payload.circuit.qubits
        existing.classical_bits = payload.circuit.classical_bits
        existing.canonical_json = canonical_data
        existing.qiskit_code = qiskit_code
        db.commit()
        db.refresh(existing)
        target = existing
    else:
        target = CircuitModel(
            user_id=user_id,
            title=title,
            qubits=payload.circuit.qubits,
            classical_bits=payload.circuit.classical_bits,
            canonical_json=canonical_data,
            qiskit_code=qiskit_code
        )
        db.add(target)
        db.commit()
        db.refresh(target)

    # Activity tracking event
    if current_user:
        try:
            from app.services.adaptive.event_service import EventService
            from app.schemas.adaptive import LearningEventCreate, LearningEventType
            EventService.record_event(
                db,
                current_user,
                LearningEventCreate(
                    event_type=LearningEventType.CIRCUIT_MODIFIED,
                    topic_id="circuit_builder",
                    metadata={"title": title, "qubits": payload.circuit.qubits}
                )
            )
        except Exception:
            pass

    return StandardSuccessResponse(
        success=True,
        data=SavedCircuitResponse(
            id=target.id,
            title=target.title,
            qubits=target.qubits,
            classical_bits=target.classical_bits,
            canonical=target.canonical_json,
            qiskit_code=target.qiskit_code,
            created_at=target.created_at.isoformat() if target.created_at else "",
            updated_at=target.updated_at.isoformat() if target.updated_at else ""
        )
    )


@router.get(
    "/saved",
    response_model=StandardSuccessResponse[List[SavedCircuitResponse]],
    status_code=status.HTTP_200_OK,
    summary="Get saved circuits for active user or library defaults"
)
def get_saved_circuits(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = select(CircuitModel)
    if current_user:
        query = query.where(
            (CircuitModel.user_id == current_user.id) | (CircuitModel.user_id.is_(None))
        )
    query = query.order_by(CircuitModel.updated_at.desc())

    records = db.execute(query).scalars().all()
    results = [
        SavedCircuitResponse(
            id=r.id,
            title=r.title,
            qubits=r.qubits,
            classical_bits=r.classical_bits,
            canonical=r.canonical_json,
            qiskit_code=r.qiskit_code,
            created_at=r.created_at.isoformat() if r.created_at else "",
            updated_at=r.updated_at.isoformat() if r.updated_at else ""
        )
        for r in records
    ]
    return StandardSuccessResponse(success=True, data=results)


@router.get(
    "/circuits/{circuit_id}",
    response_model=StandardSuccessResponse[SavedCircuitResponse],
    status_code=status.HTTP_200_OK,
    summary="Get saved circuit by ID"
)
def get_circuit_by_id(circuit_id: str, db: Session = Depends(get_db)):
    record = db.execute(select(CircuitModel).where(CircuitModel.id == circuit_id)).scalars().first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circuit not found.")

    return StandardSuccessResponse(
        success=True,
        data=SavedCircuitResponse(
            id=record.id,
            title=record.title,
            qubits=record.qubits,
            classical_bits=record.classical_bits,
            canonical=record.canonical_json,
            qiskit_code=record.qiskit_code,
            created_at=record.created_at.isoformat() if record.created_at else "",
            updated_at=record.updated_at.isoformat() if record.updated_at else ""
        )
    )


@router.post(
    "/hint",
    status_code=status.HTTP_200_OK,
    summary="Generate contextual quantum pedagogical hint for active circuit and topic"
)
def get_circuit_hint(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    topic = payload.get("topic", "Quantum Circuit")
    task = payload.get("task", "")
    lab_id = payload.get("lab_problem_id") or payload.get("problem_id")
    circuit_data = payload.get("circuit", {})
    gates = circuit_data.get("gates", []) if isinstance(circuit_data, dict) else []

    # If linked to a specific lab problem, return its progressive pedagogical hints
    if lab_id:
        try:
            from app.services.lab_service import LabService
            problem_det = LabService.get_lab_problem_detail(db, lab_id)
            if problem_det and problem_det.hints:
                hints = problem_det.hints
                hint_idx = min(len(hints) - 1, max(0, len(gates) - 1)) if gates else 0
                return StandardSuccessResponse(success=True, data={"hint": hints[hint_idx], "topic": topic})
        except Exception:
            pass

    # Contextual algorithmic heuristics
    gate_types = [g.get("type", "").upper() for g in gates if isinstance(g, dict)]

    if "bell" in topic.lower() or "entangle" in topic.lower():
        if "H" not in gate_types:
            hint = "To create entanglement, start by putting qubit 0 into equal superposition using a Hadamard (H) gate."
        elif "CNOT" not in gate_types and "CX" not in gate_types:
            hint = "You have placed Hadamard! Now apply a CNOT gate with control on q0 and target on q1 to entangle the pair into a Bell state."
        else:
            hint = "Your Bell state circuit is complete! Run the simulation on Qiskit Aer to observe equal 50% probabilities of |00> and |11>."
    elif "superposition" in topic.lower():
        if "H" not in gate_types:
            hint = "Apply a Hadamard (H) gate on the target qubit to rotate the basis state |0> into (|0> + |1>)/sqrt(2)."
        else:
            hint = "Run the circuit to verify the equal 50% probability distribution on the Bloch equator."
    else:
        if not gates:
            hint = "Drag a gate from the palette onto a qubit wire to begin constructing your quantum algorithm."
        else:
            hint = f"You have placed {len(gates)} gate(s). Click 'Run Circuit' to simulate state evolution across Qiskit Aer."

    return StandardSuccessResponse(success=True, data={"hint": hint, "topic": topic})


@router.post(
    "/validate-lab/{problem_id}",
    status_code=status.HTTP_200_OK,
    summary="Validate circuit against lab problem requirements"
)
def validate_lab(
    problem_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    from app.services.lab_service import LabService
    res = LabService.validate_lab_submission(
        db,
        problem_id=problem_id,
        circuit_data=payload.get("circuit", {}),
        simulation_result=payload.get("simulation_result"),
        user=current_user
    )
    return StandardSuccessResponse(success=True, data=res.model_dump())

