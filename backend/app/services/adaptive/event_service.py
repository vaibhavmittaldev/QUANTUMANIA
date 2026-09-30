"""
QUANTUMANIA - Learning Event Service
Phase 6: Adaptive Learning & Learner Intelligence
Validates and persists meaningful learning events across Lessons, Circuit Lab, Simulator, and AI Tutor
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.models.user import User
from app.db.models.adaptive import LearningEventModel
from app.schemas.adaptive import (
    LearningEventCreate,
    LearningActivitySchema,
    LearningEventType
)
from app.services.adaptive.curriculum_topics import CURRICULUM_TOPICS, get_topic_for_lesson


class EventService:
    @staticmethod
    def record_event(
        db: Session,
        user: User,
        event_in: LearningEventCreate
    ) -> LearningEventModel:
        """
        Records a validated learning event in the database.
        Automatically enriches topic_id from lesson_id if not explicitly provided.
        """
        topic_id = event_in.topic_id
        if not topic_id and event_in.lesson_id:
            topic_id = get_topic_for_lesson(event_in.lesson_id)

        event = LearningEventModel(
            user_id=user.id,
            event_type=event_in.event_type.value if hasattr(event_in.event_type, "value") else str(event_in.event_type),
            topic_id=topic_id,
            lesson_id=event_in.lesson_id,
            concept_id=event_in.concept_id,
            metadata_json=event_in.metadata or {},
            timestamp=datetime.now(timezone.utc)
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # Trigger on-demand mastery update for the affected topic
        if topic_id:
            try:
                from app.services.adaptive.mastery_engine import MasteryEngine
                MasteryEngine.update_topic_mastery(db, user.id, topic_id)
            except Exception as e:
                # Do not block the primary event pipeline if mastery recalculation encounters an edge case
                pass

        return event

    @staticmethod
    def get_user_events(
        db: Session,
        user_id: str,
        limit: int = 100,
        event_types: Optional[List[str]] = None
    ) -> List[LearningEventModel]:
        """Queries events for a specific user, sorted newest first."""
        query = db.query(LearningEventModel).filter(LearningEventModel.user_id == user_id)
        if event_types:
            query = query.filter(LearningEventModel.event_type.in_(event_types))
        return query.order_by(desc(LearningEventModel.timestamp)).limit(limit).all()

    @staticmethod
    def get_recent_activities(
        db: Session,
        user_id: str,
        limit: int = 10
    ) -> List[LearningActivitySchema]:
        """
        Formats recent high-signal events into user-friendly timeline items.
        Filters out low-signal interactions to keep the dashboard focused on meaningful achievements.
        """
        meaningful_types = [
            LearningEventType.LESSON_COMPLETED.value,
            LearningEventType.CIRCUIT_SIMULATED.value,
            LearningEventType.QUESTION_ANSWERED.value,
            LearningEventType.ASSESSMENT_COMPLETED.value,
            LearningEventType.PRACTICE_COMPLETED.value,
            LearningEventType.TUTOR_QUESTION.value,
            LearningEventType.TUTOR_HINT.value,
            LearningEventType.LESSON_STARTED.value,
        ]

        events = db.query(LearningEventModel).filter(
            LearningEventModel.user_id == user_id,
            LearningEventModel.event_type.in_(meaningful_types)
        ).order_by(desc(LearningEventModel.timestamp)).limit(limit).all()

        activities: List[LearningActivitySchema] = []
        for ev in events:
            topic_meta = CURRICULUM_TOPICS.get(ev.topic_id or "", {})
            topic_name = topic_meta.get("title", ev.topic_id or "Quantum Learning")

            title = "Learning Activity"
            description = ""
            meta = ev.metadata_json or {}

            if ev.event_type == LearningEventType.LESSON_COMPLETED.value:
                title = f"Completed Lesson: {topic_name}"
                description = f"Mastered core concepts in {topic_meta.get('module_title', 'Curriculum')}"
            elif ev.event_type == LearningEventType.LESSON_STARTED.value:
                title = f"Started Lesson: {topic_name}"
                description = "Began exploring theoretical foundations"
            elif ev.event_type == LearningEventType.CIRCUIT_SIMULATED.value:
                qubits = meta.get("qubits", 1)
                shots = meta.get("shots", 1024)
                gates_count = meta.get("gates_count", 0)
                title = f"Simulated {qubits}-Qubit Quantum Circuit"
                description = f"Computed exact statevector and {shots} measurement shots ({gates_count} gates applied)"
            elif ev.event_type == LearningEventType.QUESTION_ANSWERED.value:
                is_correct = meta.get("is_correct", False)
                if is_correct:
                    title = f"Correct Answer: {topic_name}"
                    description = "Demonstrated conceptual understanding in assessment"
                else:
                    title = f"Assessment Practice: {topic_name}"
                    description = "Attempted quiz question (concept practice)"
            elif ev.event_type == LearningEventType.TUTOR_QUESTION.value:
                title = f"Consulted AI Quantum Tutor"
                description = f"Investigated questions regarding {topic_name}"
            elif ev.event_type == LearningEventType.TUTOR_HINT.value:
                level = meta.get("hint_level", 1)
                title = f"Requested Level {level} Tutor Hint"
                description = f"Received Socratic guidance for {topic_name}"
            elif ev.event_type == LearningEventType.PRACTICE_COMPLETED.value:
                title = f"Completed Quantum Practice"
                description = f"Successfully validated quantum circuit for {topic_name}"
            else:
                title = f"{ev.event_type.replace('_', ' ').title()}"
                description = f"Activity on {topic_name}"

            activities.append(LearningActivitySchema(
                id=ev.id,
                event_type=ev.event_type,
                title=title,
                description=description,
                topic_id=ev.topic_id,
                lesson_id=ev.lesson_id,
                timestamp=ev.timestamp.isoformat()
            ))

        return activities

    @staticmethod
    def calculate_learning_streak(db: Session, user_id: str) -> int:
        """
        Calculates consecutive active days with meaningful learning activity.
        A day counts only when a lesson is started/completed, circuit is simulated,
        or assessment/tutor interaction occurs.
        """
        meaningful_types = [
            LearningEventType.LESSON_STARTED.value,
            LearningEventType.LESSON_COMPLETED.value,
            LearningEventType.CIRCUIT_SIMULATED.value,
            LearningEventType.QUESTION_ANSWERED.value,
            LearningEventType.ASSESSMENT_COMPLETED.value,
            LearningEventType.PRACTICE_COMPLETED.value,
            LearningEventType.TUTOR_QUESTION.value,
        ]

        events = db.query(LearningEventModel.timestamp).filter(
            LearningEventModel.user_id == user_id,
            LearningEventModel.event_type.in_(meaningful_types)
        ).order_by(desc(LearningEventModel.timestamp)).all()

        if not events:
            return 0

        # Extract unique dates in UTC
        active_dates = sorted({e.timestamp.date() for e in events}, reverse=True)
        if not active_dates:
            return 0

        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)

        # Check if the user was active today or yesterday to maintain the streak
        if active_dates[0] != today and active_dates[0] != yesterday:
            return 0

        streak = 1
        current_date = active_dates[0]

        for next_date in active_dates[1:]:
            if next_date == current_date - timedelta(days=1):
                streak += 1
                current_date = next_date
            else:
                break

        return streak
