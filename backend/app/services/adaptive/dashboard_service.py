"""
QUANTUMANIA - Adaptive Learner Dashboard Service
Phase 6: Adaptive Learning & Learner Intelligence
Aggregates authentic learner intelligence models for the dashboard and client UI
"""

from typing import List
from sqlalchemy.orm import Session
from app.db.models.user import User
from app.db.models.learning import LessonProgress, Lesson
from app.schemas.adaptive import (
    LearnerDashboardSchema,
    LearnerContextSchema
)
from app.services.adaptive.event_service import EventService
from app.services.adaptive.mastery_engine import MasteryEngine
from app.services.adaptive.recommendation_engine import RecommendationEngine


class DashboardService:
    @staticmethod
    def get_learner_dashboard(db: Session, user: User) -> LearnerDashboardSchema:
        """
        Gathers comprehensive learner intelligence for the current authenticated user.
        All metrics are derived strictly from genuine learning events and curriculum progress.
        """
        # 1. Lesson Progress
        total_lessons_count = db.query(Lesson).count() or 20
        completed_records = db.query(LessonProgress.lesson_id).filter(
            LessonProgress.user_id == user.id,
            LessonProgress.is_completed == True
        ).all()
        completed_count = len(completed_records)

        overall_progress = round(
            (completed_count / float(total_lessons_count) * 100.0) if total_lessons_count > 0 else 0.0,
            1
        )

        # 2. Topic Masteries, Strengths & Weaknesses
        all_masteries = MasteryEngine.get_all_topic_masteries(db, user.id)
        strengths = MasteryEngine.identify_strengths(db, user.id)
        weaknesses = MasteryEngine.identify_weak_topics(db, user.id)

        # 3. Recommendations
        recommendations = RecommendationEngine.generate_recommendations(db, user.id)

        # 4. Learning Streak & Recent Activity
        streak_days = EventService.calculate_learning_streak(db, user.id)
        recent_activity = EventService.get_recent_activities(db, user.id, limit=8)

        # 5. User Profile XP & Difficulty
        total_xp = user.profile.total_xp if (user.profile and hasattr(user.profile, "total_xp")) else 0
        active_mastery_scores = [m.score for m in all_masteries if m.score > 0]
        avg_mastery = (sum(active_mastery_scores) / len(active_mastery_scores)) if active_mastery_scores else 0.0
        active_difficulty = RecommendationEngine.get_learner_difficulty(avg_mastery, completed_count)

        display_name = "Learner"
        if user.profile:
            display_name = user.profile.display_name or user.profile.username or "Learner"

        return LearnerDashboardSchema(
            user_id=user.id,
            display_name=display_name,
            overall_progress=overall_progress,
            total_xp=total_xp,
            learning_streak_days=streak_days,
            completed_lessons_count=completed_count,
            total_lessons_count=total_lessons_count,
            active_difficulty=active_difficulty,
            topic_mastery=all_masteries,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations,
            recent_activity=recent_activity
        )

    @staticmethod
    def get_learner_context(db: Session, user: User, current_lesson_id: str = None) -> LearnerContextSchema:
        """
        Builds a compact LearnerContext to inject into Phase 5 AI Tutor.
        Provides mastery, weak areas, and recommendations without leaking private data.
        """
        completed_records = db.query(LessonProgress.lesson_id).filter(
            LessonProgress.user_id == user.id,
            LessonProgress.is_completed == True
        ).all()
        total_lessons_count = db.query(Lesson).count() or 20
        overall_progress = round((len(completed_records) / float(total_lessons_count) * 100.0), 1)

        all_masteries = MasteryEngine.get_all_topic_masteries(db, user.id)
        strengths = MasteryEngine.identify_strengths(db, user.id)
        weaknesses = MasteryEngine.identify_weak_topics(db, user.id)
        recommendations = RecommendationEngine.generate_recommendations(db, user.id)

        current_topic = None
        if current_lesson_id:
            from app.services.adaptive.curriculum_topics import get_topic_for_lesson
            current_topic = get_topic_for_lesson(current_lesson_id)

        return LearnerContextSchema(
            overall_progress=overall_progress,
            current_topic=current_topic,
            topic_mastery=[m for m in all_masteries if m.score > 0][:8],
            weak_topics=weaknesses,
            strengths=strengths,
            recommended_next=recommendations[:3]
        )
