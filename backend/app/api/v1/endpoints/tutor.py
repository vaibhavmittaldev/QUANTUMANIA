"""
QUANTUMANIA - AI Quantum Tutor API Endpoints
Phase 5: AI Quantum Tutor
Mounts tutor querying and status endpoints
"""

from fastapi import APIRouter, status, HTTPException
from app.schemas.common import StandardSuccessResponse
from app.schemas.tutor import (
    TutorRequest,
    TutorResponse,
    TutorMode
)
from app.services.tutor.tutor_service import TutorService
from app.core.config import settings

router = APIRouter(prefix="/tutor", tags=["tutor"])


@router.post(
    "/query",
    response_model=StandardSuccessResponse[TutorResponse],
    status_code=status.HTTP_200_OK,
    summary="Query the AI Quantum Tutor with circuit, simulation, and lesson context"
)
async def query_tutor(payload: TutorRequest):
    """
    Processes a learner inquiry or quick action:
    - Anchors advice strictly to Phase 3 circuit and Phase 4 simulation
    - Supports explain, hint, ask, guide, and analyze modes
    - Never fabricates quantum probabilities or gates
    """
    response = await TutorService.process_request(payload)
    return StandardSuccessResponse(success=True, data=response)


@router.get(
    "/status",
    status_code=status.HTTP_200_OK,
    summary="Get AI Quantum Tutor health and active provider capabilities"
)
def get_tutor_status():
    has_gemini = bool(settings.GEMINI_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)
    active_provider = settings.AI_PROVIDER

    if active_provider == "auto":
        active_provider = "gemini" if has_gemini else ("openai" if has_openai else "deterministic")

    return StandardSuccessResponse(
        success=True,
        data={
            "status": "ready",
            "active_provider": active_provider,
            "has_external_api_key": has_gemini or has_openai,
            "supported_modes": [m.value for m in TutorMode],
            "max_conversation_history": settings.TUTOR_MAX_HISTORY,
            "grounding_sources": [
                "Phase 2 Lesson Curriculum",
                "Phase 3 Canonical Circuit",
                "Phase 4 Classical State-Vector Simulator"
            ]
        }
    )
