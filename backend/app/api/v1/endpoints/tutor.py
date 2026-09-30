"""
QUANTUMANIA - AI Quantum Tutor API Endpoints
Phase 5: AI Quantum Tutor
Mounts tutor querying and status endpoints
"""

from typing import Optional
from fastapi import APIRouter, status, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.user import User
from app.api.deps import get_current_user_optional
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
async def query_tutor(
    payload: TutorRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Processes a learner inquiry or quick action:
    - Anchors advice strictly to Phase 3 circuit and Phase 4 simulation
    - Adapts pedagogical explanations using Phase 6 Learner Model & Mastery
    - Never fabricates quantum probabilities or gates
    """
    # Phase 6: Auto-hydrate learner context if user is authenticated and context wasn't explicitly supplied
    if current_user and not payload.learner_context:
        try:
            from app.services.adaptive.dashboard_service import DashboardService
            current_les_id = payload.lesson_context.lesson_id if payload.lesson_context else None
            payload.learner_context = DashboardService.get_learner_context(
                db,
                current_user,
                current_lesson_id=current_les_id
            )
        except Exception:
            pass

    response = await TutorService.process_request(payload)

    # Phase 6: Record tutor interaction learning event
    if current_user:
        try:
            from app.services.adaptive.event_service import EventService
            from app.schemas.adaptive import LearningEventCreate, LearningEventType
            from app.services.adaptive.curriculum_topics import get_topic_for_lesson, get_topic_for_gates

            ev_type = LearningEventType.TUTOR_QUESTION
            if payload.mode == TutorMode.HINT:
                ev_type = LearningEventType.TUTOR_HINT
            elif payload.mode == TutorMode.EXPLAIN:
                ev_type = LearningEventType.TUTOR_EXPLANATION
            elif payload.mode == TutorMode.ANALYZE:
                ev_type = LearningEventType.TUTOR_ANALYSIS

            topic_id = None
            if payload.lesson_context and payload.lesson_context.lesson_id:
                topic_id = get_topic_for_lesson(payload.lesson_context.lesson_id)
            elif payload.circuit_context and payload.circuit_context.circuit:
                gates = [g.type.value if hasattr(g.type, "value") else str(g.type) for g in payload.circuit_context.circuit.gates]
                topics = get_topic_for_gates(gates)
                if topics:
                    topic_id = topics[0]

            EventService.record_event(
                db,
                current_user,
                LearningEventCreate(
                    event_type=ev_type,
                    topic_id=topic_id,
                    metadata={
                        "mode": payload.mode.value,
                        "hint_level": payload.hint_level,
                        "has_message": bool(payload.message)
                    }
                )
            )
        except Exception:
            pass

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
