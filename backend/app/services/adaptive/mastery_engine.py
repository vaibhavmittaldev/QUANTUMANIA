"""
QUANTUMANIA - Topic Mastery Engine
Phase 6: Adaptive Learning & Learner Intelligence
Calculates transparent, explainable topic mastery scores, confidence, and identifies weak & strong areas
"""

from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.models.adaptive import TopicMasteryModel, LearningEventModel
from app.db.models.learning import LessonProgress, Lesson
from app.schemas.adaptive import TopicMasterySchema, LearningEventType
from app.services.adaptive.curriculum_topics import CURRICULUM_TOPICS, get_topic_for_lesson


# Centralized Configuration Constants (Section 75)
MASTERY_WEIGHTS = {
    "assessment_accuracy": 0.40,
    "lesson_completion": 0.25,
    "circuit_activity": 0.15,
    "practice_engagement": 0.10,
    "recency_bonus": 0.10,
}

MASTERY_THRESHOLDS = {
    "not_started": (0.0, 24.9),
    "beginning": (25.0, 49.9),
    "developing": (50.0, 69.9),
    "proficient": (70.0, 84.9),
    "strong": (85.0, 100.0),
}

RECENCY_WINDOW_DAYS = 14
MIN_ATTEMPTS_FOR_WEAKNESS = 2
MIN_ATTEMPTS_FOR_CONFIDENCE = 5


class MasteryEngine:
    @staticmethod
    def get_level_for_score(score: float) -> str:
        """Categorizes numeric score (0-100) into human-readable level."""
        if score >= 85.0:
            return "Strong"
        elif score >= 70.0:
            return "Proficient"
        elif score >= 50.0:
            return "Developing"
        elif score >= 25.0:
            return "Beginning"
        return "Not Started"

    @staticmethod
    def calculate_topic_mastery(
        db: Session,
        user_id: str,
        topic_id: str
    ) -> Tuple[float, float, int, int, Optional[datetime]]:
        """
        Calculates deterministic, explainable mastery score and confidence for a topic.
        Returns:
            (score, confidence, total_attempts, correct_attempts, last_activity_at)
        """
        topic_meta = CURRICULUM_TOPICS.get(topic_id)
        if not topic_meta:
            return (0.0, 0.0, 0, 0, None)

        lesson_id = topic_meta.get("lesson_id")
        associated_gates = topic_meta.get("associated_gates", [])

        # 1. Lesson Completion Component (25%)
        lesson_score = 0.0
        if lesson_id:
            prog = db.query(LessonProgress).filter(
                LessonProgress.user_id == user_id,
                LessonProgress.lesson_id == lesson_id
            ).first()
            if prog:
                if prog.is_completed:
                    lesson_score = 100.0
                else:
                    lesson_score = 40.0

        # 2. Gather Learning Events for this topic
        events = db.query(LearningEventModel).filter(
            LearningEventModel.user_id == user_id,
            (LearningEventModel.topic_id == topic_id) | (LearningEventModel.lesson_id == lesson_id)
        ).order_by(desc(LearningEventModel.timestamp)).all()

        if not events and lesson_score == 0.0:
            return (0.0, 0.0, 0, 0, None)

        now = datetime.now(timezone.utc)
        last_activity_at = events[0].timestamp if events else (prog.started_at if prog else None)

        # 3. Assessment Accuracy (40%)
        assessment_events = [
            e for e in events
            if e.event_type in (
                LearningEventType.QUESTION_ANSWERED.value,
                LearningEventType.ASSESSMENT_COMPLETED.value
            )
        ]
        total_attempts = len(assessment_events)
        correct_attempts = 0
        for ev in assessment_events:
            meta = ev.metadata_json or {}
            if meta.get("is_correct", False):
                correct_attempts += 1

        assessment_accuracy = 0.0
        has_assessment_data = total_attempts > 0
        if has_assessment_data:
            assessment_accuracy = (correct_attempts / total_attempts) * 100.0

        # 4. Circuit & Simulation Activity (15%)
        # Look for simulation events that used relevant gates or are tied to this topic
        sim_events = [
            e for e in events
            if e.event_type == LearningEventType.CIRCUIT_SIMULATED.value
        ]
        # Also check circuits simulated with matching gates even if topic_id wasn't directly tagged
        circuit_score = min(100.0, len(sim_events) * 35.0)

        # 5. Practice & Tutor Engagement (10%)
        tutor_events = [
            e for e in events
            if e.event_type in (
                LearningEventType.TUTOR_QUESTION.value,
                LearningEventType.TUTOR_HINT.value,
                LearningEventType.TUTOR_EXPLANATION.value,
                LearningEventType.PRACTICE_COMPLETED.value
            )
        ]
        # Proactive inquiry gives positive points, but excessive repeated hints (>3) indicate struggling
        hint_count = sum(1 for e in tutor_events if e.event_type == LearningEventType.TUTOR_HINT.value)
        practice_count = sum(1 for e in tutor_events if e.event_type == LearningEventType.PRACTICE_COMPLETED.value)
        tutor_score = min(100.0, (len(tutor_events) * 20.0) + (practice_count * 40.0))
        if hint_count >= 3 and correct_attempts == 0 and has_assessment_data:
            # High hint dependency without correct answers caps engagement benefit
            tutor_score = min(tutor_score, 40.0)

        # 6. Recency Factor (10%)
        recency_score = 0.0
        if last_activity_at:
            if last_activity_at.tzinfo is None:
                last_activity_at = last_activity_at.replace(tzinfo=timezone.utc)
            delta_days = (now - last_activity_at).total_seconds() / 86400.0
            if delta_days <= 3.0:
                recency_score = 100.0
            elif delta_days <= RECENCY_WINDOW_DAYS:
                recency_score = 80.0
            elif delta_days <= 30.0:
                recency_score = 50.0
            else:
                recency_score = 25.0

        # Explainable Weighted Aggregation
        if has_assessment_data:
            # Full multi-factor formula
            raw_score = (
                (assessment_accuracy * MASTERY_WEIGHTS["assessment_accuracy"]) +
                (lesson_score * MASTERY_WEIGHTS["lesson_completion"]) +
                (circuit_score * MASTERY_WEIGHTS["circuit_activity"]) +
                (tutor_score * MASTERY_WEIGHTS["practice_engagement"]) +
                (recency_score * MASTERY_WEIGHTS["recency_bonus"])
            )
        else:
            # No assessments taken yet: re-normalize weights across available signals (Lesson, Circuit, Tutor, Recency)
            # Normalization factor: 1.0 - 0.40 = 0.60
            raw_score = (
                (lesson_score * 0.45) +
                (circuit_score * 0.25) +
                (tutor_score * 0.15) +
                (recency_score * 0.15)
            )

        final_score = round(max(0.0, min(100.0, raw_score)), 1)

        # Confidence Calculation: based on empirical evidence volume
        evidence_points = total_attempts + (1 if lesson_score > 0 else 0) + len(sim_events) + len(tutor_events)
        confidence = round(min(1.0, evidence_points / float(MIN_ATTEMPTS_FOR_CONFIDENCE)), 2)

        return (final_score, confidence, total_attempts, correct_attempts, last_activity_at)

    @staticmethod
    def update_topic_mastery(db: Session, user_id: str, topic_id: str) -> TopicMasteryModel:
        """Calculates and persists the updated topic mastery model in SQLite."""
        score, confidence, attempts, correct_attempts, last_activity = (
            MasteryEngine.calculate_topic_mastery(db, user_id, topic_id)
        )
        level = MasteryEngine.get_level_for_score(score)

        record = db.query(TopicMasteryModel).filter(
            TopicMasteryModel.user_id == user_id,
            TopicMasteryModel.topic_id == topic_id
        ).first()

        now = datetime.now(timezone.utc)
        if not record:
            record = TopicMasteryModel(
                user_id=user_id,
                topic_id=topic_id,
                score=score,
                confidence=confidence,
                attempts=attempts,
                correct_attempts=correct_attempts,
                level=level,
                last_activity_at=last_activity or now,
                updated_at=now
            )
            db.add(record)
        else:
            record.score = score
            record.confidence = confidence
            record.attempts = attempts
            record.correct_attempts = correct_attempts
            record.level = level
            if last_activity:
                record.last_activity_at = last_activity
            record.updated_at = now

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_all_topic_masteries(db: Session, user_id: str) -> List[TopicMasterySchema]:
        """
        Retrieves all curriculum topics with their current mastery state.
        Ensures 0% / Not Started is accurately represented for untackled topics.
        """
        persisted = {
            m.topic_id: m for m in
            db.query(TopicMasteryModel).filter(TopicMasteryModel.user_id == user_id).all()
        }

        # Check lessons completed by this user directly to catch untracked topics
        completed_lesson_ids = {
            lp.lesson_id for lp in db.query(LessonProgress.lesson_id).filter(
                LessonProgress.user_id == user_id,
                LessonProgress.is_completed == True
            ).all()
        }

        results: List[TopicMasterySchema] = []
        for t_id, meta in CURRICULUM_TOPICS.items():
            if t_id in persisted:
                rec = persisted[t_id]
                results.append(TopicMasterySchema(
                    topic_id=t_id,
                    topic_title=meta["title"],
                    module_title=meta.get("module_title"),
                    score=rec.score,
                    confidence=rec.confidence,
                    attempts=rec.attempts,
                    correct_attempts=rec.correct_attempts,
                    level=rec.level,
                    last_activity_at=rec.last_activity_at.isoformat() if rec.last_activity_at else None
                ))
            else:
                # If lesson is completed but no mastery record exists yet, compute it now
                if meta.get("lesson_id") in completed_lesson_ids:
                    rec = MasteryEngine.update_topic_mastery(db, user_id, t_id)
                    results.append(TopicMasterySchema(
                        topic_id=t_id,
                        topic_title=meta["title"],
                        module_title=meta.get("module_title"),
                        score=rec.score,
                        confidence=rec.confidence,
                        attempts=rec.attempts,
                        correct_attempts=rec.correct_attempts,
                        level=rec.level,
                        last_activity_at=rec.last_activity_at.isoformat() if rec.last_activity_at else None
                    ))
                else:
                    results.append(TopicMasterySchema(
                        topic_id=t_id,
                        topic_title=meta["title"],
                        module_title=meta.get("module_title"),
                        score=0.0,
                        confidence=0.0,
                        attempts=0,
                        correct_attempts=0,
                        level="Not Started",
                        last_activity_at=None
                    ))

        return results

    @staticmethod
    def identify_weak_topics(db: Session, user_id: str) -> List[str]:
        """
        Identifies topics where the learner demonstrates difficulty:
        - Score < 50% with at least MIN_ATTEMPTS_FOR_WEAKNESS attempts
        - Accuracy < 50% on assessments
        - Repeated tutor hints (>= 3)
        """
        masteries = db.query(TopicMasteryModel).filter(
            TopicMasteryModel.user_id == user_id
        ).all()

        weak_topics: List[str] = []
        for m in masteries:
            if m.attempts >= MIN_ATTEMPTS_FOR_WEAKNESS:
                accuracy = (m.correct_attempts / m.attempts) if m.attempts > 0 else 1.0
                if m.score < 50.0 or accuracy < 0.5:
                    weak_topics.append(m.topic_id)
                    continue

            # Check if there are repeated tutor hints for this topic
            hint_count = db.query(LearningEventModel).filter(
                LearningEventModel.user_id == user_id,
                LearningEventModel.topic_id == m.topic_id,
                LearningEventModel.event_type == LearningEventType.TUTOR_HINT.value
            ).count()
            if hint_count >= 3 and m.score < 60.0:
                if m.topic_id not in weak_topics:
                    weak_topics.append(m.topic_id)

        return weak_topics

    @staticmethod
    def identify_strengths(db: Session, user_id: str) -> List[str]:
        """
        Identifies topics where the learner exhibits strong mastery:
        - Score >= 70% with confidence >= 0.4
        """
        masteries = db.query(TopicMasteryModel).filter(
            TopicMasteryModel.user_id == user_id,
            TopicMasteryModel.score >= 70.0,
            TopicMasteryModel.confidence >= 0.4
        ).all()

        return [m.topic_id for m in masteries]
