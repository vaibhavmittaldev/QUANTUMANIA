"""
QUANTUMANIA - Quantum Circuit & Lab API Endpoints
Phase 3: Quantum Circuit Builder
"""

from typing import List
from fastapi import APIRouter, status, HTTPException
from app.schemas.common import StandardSuccessResponse, StandardErrorResponse
from app.schemas.circuit import (
    CanonicalCircuitSchema,
    CircuitValidationResponse,
    CircuitTemplateSummary
)
from app.services.circuit_service import CircuitService

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
