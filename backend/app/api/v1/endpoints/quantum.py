"""
QUANTUMANIA - Quantum Circuit & Lab API Endpoints
Phase 3: Quantum Circuit Builder
"""

from typing import List, Optional
from fastapi import APIRouter, status, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.user import User
from app.api.deps import get_current_user_optional
from app.schemas.common import StandardSuccessResponse, StandardErrorResponse
from app.schemas.circuit import (
    CanonicalCircuitSchema,
    CircuitValidationResponse,
    CircuitTemplateSummary
)
from app.schemas.simulation import (
    SimulationRequest,
    SimulationResultSchema
)
from app.services.circuit_service import CircuitService
from app.services.simulation_service import SimulationService

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
    summary="Simulate canonical quantum circuit with exact statevector and measurement sampling"
)
def simulate_circuit(
    payload: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    result = SimulationService.simulate(payload.circuit, shots=payload.shots)
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
                        "gates": gates[:10]
                    }
                )
            )
        except Exception:
            pass

    return StandardSuccessResponse(success=True, data=result)

