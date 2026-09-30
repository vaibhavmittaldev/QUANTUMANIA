"""
QUANTUMANIA - Adaptive Learning & Learner Intelligence Schemas
Phase 6: Adaptive Learning & Learner Intelligence
Strict request/response contracts for events, mastery, and personalized recommendations
"""

from enum import Enum
from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class LearningEventType(str, Enum):
    LESSON_STARTED = "lesson_started"
    LESSON_COMPLETED = "lesson_completed"
    TOPIC_VIEWED = "topic_viewed"
    ASSESSMENT_STARTED = "assessment_started"
    ASSESSMENT_COMPLETED = "assessment_completed"
    QUESTION_ANSWERED = "question_answered"
    CIRCUIT_CREATED = "circuit_created"
    CIRCUIT_MODIFIED = "circuit_modified"
    CIRCUIT_SIMULATED = "circuit_simulated"
    TUTOR_QUESTION = "tutor_question"
    TUTOR_HINT = "tutor_hint"
    TUTOR_EXPLANATION = "tutor_explanation"
    TUTOR_ANALYSIS = "tutor_analysis"
    PRACTICE_COMPLETED = "practice_completed"


class RecommendationType(str, Enum):
    CONTINUE_LEARNING = "continue_learning"
    REVIEW_LESSON = "review_lesson"
    BUILD_CIRCUIT = "build_circuit"
    RUN_SIMULATION = "run_simulation"
    ATTEMPT_ASSESSMENT = "attempt_assessment"
    ASK_TUTOR = "ask_tutor"


class LearningEventCreate(BaseModel):
    event_type: LearningEventType
    topic_id: Optional[str] = Field(None, max_length=100)
    lesson_id: Optional[str] = Field(None, max_length=100)
    concept_id: Optional[str] = Field(None, max_length=100)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class LearningEventResponse(BaseModel):
    id: str
    user_id: str
    event_type: str
    topic_id: Optional[str] = None
    lesson_id: Optional[str] = None
    concept_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: str


class TopicMasterySchema(BaseModel):
    topic_id: str
    topic_title: str
    module_title: Optional[str] = None
    score: float = Field(0.0, ge=0.0, le=100.0)
    confidence: float = Field(0.0, ge=0.0, le=1.0)
    attempts: int = Field(0, ge=0)
    correct_attempts: int = Field(0, ge=0)
    level: str = "Not Started"
    last_activity_at: Optional[str] = None


class RecommendationSchema(BaseModel):
    id: str
    type: RecommendationType
    title: str
    description: str
    priority: int = Field(..., ge=1, le=100)
    reason: str
    target_id: Optional[str] = None
    action_url: str
    difficulty: str = "beginner"


class LearningActivitySchema(BaseModel):
    id: str
    event_type: str
    title: str
    description: str
    topic_id: Optional[str] = None
    lesson_id: Optional[str] = None
    timestamp: str


class AssessmentSubmissionRequest(BaseModel):
    topic_id: str
    question_id: str
    is_correct: bool
    user_answer: Optional[str] = None
    score: Optional[float] = 100.0
    metadata: Optional[Dict[str, Any]] = None


class LearnerContextSchema(BaseModel):
    overall_progress: float = 0.0
    current_topic: Optional[str] = None
    topic_mastery: Optional[List[TopicMasterySchema]] = Field(default_factory=list)
    weak_topics: Optional[List[str]] = Field(default_factory=list)
    strengths: Optional[List[str]] = Field(default_factory=list)
    recommended_next: Optional[List[RecommendationSchema]] = Field(default_factory=list)


class LearnerDashboardSchema(BaseModel):
    user_id: str
    display_name: str
    overall_progress: float
    total_xp: int
    learning_streak_days: int
    completed_lessons_count: int
    total_lessons_count: int
    active_difficulty: str
    topic_mastery: List[TopicMasterySchema]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[RecommendationSchema]
    recent_activity: List[LearningActivitySchema]
