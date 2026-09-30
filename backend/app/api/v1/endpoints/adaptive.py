"""
QUANTUMANIA - Adaptive Learning API Endpoints
Phase 6: Adaptive Learning & Learner Intelligence
Provides endpoints for learning event ingestion, learner dashboard, topic mastery, and recommendations
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.user import User
from app.api.deps import get_current_user
from app.schemas.common import StandardSuccessResponse
from app.schemas.adaptive import (
    LearningEventCreate,
    LearningEventResponse,
    LearnerDashboardSchema,
    TopicMasterySchema,
    RecommendationSchema,
    AssessmentSubmissionRequest,
    LearnerContextSchema,
    LearningEventType
)
from app.services.adaptive.event_service import EventService
from app.services.adaptive.mastery_engine import MasteryEngine
from app.services.adaptive.recommendation_engine import RecommendationEngine
from app.services.adaptive.dashboard_service import DashboardService

router = APIRouter(prefix="/adaptive", tags=["Adaptive Learning & Learner Intelligence"])


@router.post(
    "/events",
    response_model=StandardSuccessResponse[LearningEventResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Record a verified learning event"
)
def record_learning_event(
    payload: LearningEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingests learning events across Lessons, Circuit Builder, Simulator, and AI Tutor.
    Strictly isolated to authenticated user.
    """
    event = EventService.record_event(db, current_user, payload)
    return StandardSuccessResponse(
        success=True,
        data=LearningEventResponse(
            id=event.id,
            user_id=event.user_id,
            event_type=event.event_type,
            topic_id=event.topic_id,
            lesson_id=event.lesson_id,
            concept_id=event.concept_id,
            metadata=event.metadata_json,
            timestamp=event.timestamp.isoformat()
        )
    )


@router.get(
    "/dashboard",
    response_model=StandardSuccessResponse[LearnerDashboardSchema],
    status_code=status.HTTP_200_OK,
    summary="Get aggregated learner intelligence dashboard for current user"
)
def get_learner_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves authentic, calculated learning metrics:
    - Overall syllabus progress
    - Real topic mastery percentages (0-100%)
    - Prerequisite-aware personalized recommendations
    - Active learning streak and recent timeline
    """
    dashboard_data = DashboardService.get_learner_dashboard(db, current_user)
    return StandardSuccessResponse(success=True, data=dashboard_data)


@router.get(
    "/mastery",
    response_model=StandardSuccessResponse[List[TopicMasterySchema]],
    status_code=status.HTTP_200_OK,
    summary="Get detailed topic mastery breakdown for current user"
)
def get_topic_masteries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns verified mastery scores across all curriculum quantum topics."""
    masteries = MasteryEngine.get_all_topic_masteries(db, current_user.id)
    return StandardSuccessResponse(success=True, data=masteries)


@router.get(
    "/recommendations",
    response_model=StandardSuccessResponse[List[RecommendationSchema]],
    status_code=status.HTTP_200_OK,
    summary="Get personalized learning recommendations"
)
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates 3-5 prioritized recommendations based on current mastery and weak areas."""
    recs = RecommendationEngine.generate_recommendations(db, current_user.id)
    return StandardSuccessResponse(success=True, data=recs)


@router.post(
    "/assessment",
    response_model=StandardSuccessResponse[TopicMasterySchema],
    status_code=status.HTTP_200_OK,
    summary="Submit assessment answer to update topic mastery"
)
def submit_assessment_answer(
    payload: AssessmentSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Records an assessment attempt and immediately updates topic mastery.
    """
    event_in = LearningEventCreate(
        event_type=LearningEventType.QUESTION_ANSWERED,
        topic_id=payload.topic_id,
        metadata={
            "question_id": payload.question_id,
            "is_correct": payload.is_correct,
            "user_answer": payload.user_answer,
            "score": payload.score
        }
    )
    EventService.record_event(db, current_user, event_in)

    # Recalculate mastery
    updated_mastery = MasteryEngine.update_topic_mastery(db, current_user.id, payload.topic_id)
    from app.services.adaptive.curriculum_topics import CURRICULUM_TOPICS
    topic_meta = CURRICULUM_TOPICS.get(payload.topic_id, {})

    return StandardSuccessResponse(
        success=True,
        data=TopicMasterySchema(
            topic_id=updated_mastery.topic_id,
            topic_title=topic_meta.get("title", updated_mastery.topic_id),
            module_title=topic_meta.get("module_title"),
            score=updated_mastery.score,
            confidence=updated_mastery.confidence,
            attempts=updated_mastery.attempts,
            correct_attempts=updated_mastery.correct_attempts,
            level=updated_mastery.level,
            last_activity_at=updated_mastery.last_activity_at.isoformat() if updated_mastery.last_activity_at else None
        )
    )


@router.get(
    "/context",
    response_model=StandardSuccessResponse[LearnerContextSchema],
    status_code=status.HTTP_200_OK,
    summary="Get compact learner context for AI Tutor integration"
)
def get_learner_context(
    lesson_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates privacy-preserving learner context for Phase 5 AI Tutor."""
    ctx = DashboardService.get_learner_context(db, current_user, current_lesson_id=lesson_id)
    return StandardSuccessResponse(success=True, data=ctx)
