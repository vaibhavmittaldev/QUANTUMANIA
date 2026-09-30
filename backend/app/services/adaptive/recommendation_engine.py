"""
QUANTUMANIA - Personalized Recommendation Engine
Phase 6: Adaptive Learning & Learner Intelligence
Generates prioritized, diverse, and prerequisite-aware learning recommendations
"""

from typing import List, Dict, Optional, Set, Any
from sqlalchemy.orm import Session
from app.db.models.learning import LessonProgress, Lesson, Module
from app.schemas.adaptive import (
    RecommendationSchema,
    RecommendationType
)
from app.services.adaptive.curriculum_topics import (
    CURRICULUM_TOPICS,
    LESSON_TO_TOPIC_MAP
)
from app.services.adaptive.mastery_engine import MasteryEngine

RECOMMENDATION_LIMIT = 4


class RecommendationEngine:
    @staticmethod
    def get_learner_difficulty(average_mastery: float, completed_count: int) -> str:
        """Determines active adaptive difficulty level based on empirical progress and mastery."""
        if completed_count >= 12 and average_mastery >= 75.0:
            return "advanced"
        elif completed_count >= 4 and average_mastery >= 50.0:
            return "intermediate"
        return "beginner"

    @staticmethod
    def generate_recommendations(
        db: Session,
        user_id: str
    ) -> List[RecommendationSchema]:
        """
        Synthesizes topic masteries, weak areas, unfinished lessons, and prerequisite graph
        to generate 3-5 prioritized and diverse next actions.
        """
        # 1. Fetch completed lessons
        completed_records = db.query(LessonProgress.lesson_id).filter(
            LessonProgress.user_id == user_id,
            LessonProgress.is_completed == True
        ).all()
        completed_lesson_ids = {r[0] for r in completed_records}

        # 2. Identify weak areas and strengths
        weak_topic_ids = MasteryEngine.identify_weak_topics(db, user_id)
        strength_topic_ids = set(MasteryEngine.identify_strengths(db, user_id))

        # 3. Topic masteries map
        all_masteries = {
            m.topic_id: m for m in MasteryEngine.get_all_topic_masteries(db, user_id)
        }

        # Calculate average mastery
        active_mastery_scores = [m.score for m in all_masteries.values() if m.score > 0]
        avg_mastery = (sum(active_mastery_scores) / len(active_mastery_scores)) if active_mastery_scores else 0.0
        active_difficulty = RecommendationEngine.get_learner_difficulty(avg_mastery, len(completed_lesson_ids))

        recommendations: List[RecommendationSchema] = []
        rec_counter = 1

        # -------------------------------------------------------------
        # PRIORITY 1: Weak Area Remediation (Prerequisite-Aware)
        # -------------------------------------------------------------
        for w_id in weak_topic_ids:
            if len(recommendations) >= RECOMMENDATION_LIMIT:
                break

            meta = CURRICULUM_TOPICS.get(w_id)
            if not meta:
                continue

            # Check if any prerequisites for this weak topic are also unmastered
            prereqs = meta.get("prerequisites", [])
            unmet_prereq = None
            for p in prereqs:
                p_mastery = all_masteries.get(p)
                if not p_mastery or p_mastery.score < 50.0:
                    unmet_prereq = p
                    break

            if unmet_prereq:
                # Recommend strengthening the foundational prerequisite first!
                p_meta = CURRICULUM_TOPICS.get(unmet_prereq, {})
                recommendations.append(RecommendationSchema(
                    id=f"rec_{rec_counter}",
                    type=RecommendationType.REVIEW_LESSON,
                    title=f"Review Foundation: {p_meta.get('title', 'Quantum Foundations')}",
                    description=f"Strengthen this core concept before returning to {meta['title']}.",
                    priority=95,
                    reason=f"Prerequisite concept {p_meta.get('title')} requires reinforcement to support mastery in {meta['title']}.",
                    target_id=p_meta.get("lesson_id"),
                    action_url=f"/app/learn/lessons/{p_meta.get('lesson_id', 'les_01_what_is_qc')}",
                    difficulty="beginner"
                ))
                rec_counter += 1
            else:
                # Direct remediation for the weak topic
                practice_template = meta.get("practice_template_id")
                if practice_template:
                    recommendations.append(RecommendationSchema(
                        id=f"rec_{rec_counter}",
                        type=RecommendationType.BUILD_CIRCUIT,
                        title=f"Practice in Quantum Lab: {meta['title']}",
                        description=f"Reinforce your understanding by constructing and simulating a hands-on circuit.",
                        priority=90,
                        reason=f"Your recent accuracy in {meta['title']} indicates additional interactive circuit experimentation will solidify understanding.",
                        target_id=practice_template,
                        action_url=f"/app/quantum-lab?template={practice_template}",
                        difficulty=meta.get("difficulty", "intermediate")
                    ))
                else:
                    recommendations.append(RecommendationSchema(
                        id=f"rec_{rec_counter}",
                        type=RecommendationType.REVIEW_LESSON,
                        title=f"Review Concept: {meta['title']}",
                        description="Revisit the theoretical lesson and Dirac notation to resolve misconceptions.",
                        priority=88,
                        reason=f"Identified as an area needing reinforcement based on recent assessment accuracy.",
                        target_id=meta.get("lesson_id"),
                        action_url=f"/app/learn/lessons/{meta.get('lesson_id')}",
                        difficulty=meta.get("difficulty", "beginner")
                    ))
                rec_counter += 1

        # -------------------------------------------------------------
        # PRIORITY 2: Continue Learning (Next Incomplete Lesson)
        # -------------------------------------------------------------
        all_lessons = db.query(Lesson).join(Module).order_by(
            Module.display_order,
            Lesson.display_order
        ).all()

        next_incomplete_lesson = None
        for l in all_lessons:
            if l.id not in completed_lesson_ids:
                next_incomplete_lesson = l
                break

        if next_incomplete_lesson and len(recommendations) < RECOMMENDATION_LIMIT:
            topic_id = LESSON_TO_TOPIC_MAP.get(next_incomplete_lesson.id, "quantum_foundations")
            topic_meta = CURRICULUM_TOPICS.get(topic_id, {})

            action_type = (
                RecommendationType.CONTINUE_LEARNING
                if len(completed_lesson_ids) > 0
                else RecommendationType.CONTINUE_LEARNING
            )
            title = (
                f"Continue: {next_incomplete_lesson.title}"
                if len(completed_lesson_ids) > 0
                else f"Start First Lesson: {next_incomplete_lesson.title}"
            )

            recommendations.append(RecommendationSchema(
                id=f"rec_{rec_counter}",
                type=action_type,
                title=title,
                description=f"Module {next_incomplete_lesson.module.display_order}: {next_incomplete_lesson.description or 'Progress through the structured curriculum.'}",
                priority=85,
                reason="Unfinished lesson in your structured quantum curriculum roadmap.",
                target_id=next_incomplete_lesson.id,
                action_url=f"/app/learn/lessons/{next_incomplete_lesson.id}",
                difficulty=next_incomplete_lesson.difficulty
            ))
            rec_counter += 1

        # -------------------------------------------------------------
        # PRIORITY 3: Hands-on Lab Challenge (Quantum Lab Simulation)
        # -------------------------------------------------------------
        # Find the most recently completed lesson with an associated circuit template
        if len(recommendations) < RECOMMENDATION_LIMIT:
            for l in reversed(all_lessons):
                if l.id in completed_lesson_ids:
                    t_id = LESSON_TO_TOPIC_MAP.get(l.id)
                    t_meta = CURRICULUM_TOPICS.get(t_id or "", {})
                    tpl = t_meta.get("practice_template_id")
                    if tpl:
                        recommendations.append(RecommendationSchema(
                            id=f"rec_{rec_counter}",
                            type=RecommendationType.BUILD_CIRCUIT,
                            title=f"Lab Challenge: Build {t_meta['title']}",
                            description=f"Validate your theoretical knowledge by creating and simulating a live circuit.",
                            priority=75,
                            reason=f"Solidifies conceptual learning from your completed lesson on {t_meta['title']}.",
                            target_id=tpl,
                            action_url=f"/app/quantum-lab?template={tpl}",
                            difficulty=t_meta.get("difficulty", "intermediate")
                        ))
                        rec_counter += 1
                        break

        # -------------------------------------------------------------
        # PRIORITY 4: AI Tutor Socratic Guidance
        # -------------------------------------------------------------
        if len(recommendations) < RECOMMENDATION_LIMIT:
            # If user has any developing or weak topics, recommend Socratic inquiry
            target_topic = None
            if weak_topic_ids:
                target_topic = CURRICULUM_TOPICS.get(weak_topic_ids[0])
            elif next_incomplete_lesson:
                t_id = LESSON_TO_TOPIC_MAP.get(next_incomplete_lesson.id)
                target_topic = CURRICULUM_TOPICS.get(t_id or "")

            if target_topic:
                recommendations.append(RecommendationSchema(
                    id=f"rec_{rec_counter}",
                    type=RecommendationType.ASK_TUTOR,
                    title=f"Ask AI Tutor about {target_topic['title']}",
                    description="Consult the pedagogical AI Tutor for intuitive analogies and mathematical step-by-step guidance.",
                    priority=65,
                    reason="Targeted Socratic dialogue helps bridge difficult quantum mechanics intuition.",
                    target_id=target_topic["topic_id"],
                    action_url="/app/quantum-lab",
                    difficulty=target_topic.get("difficulty", "beginner")
                ))
                rec_counter += 1

        # -------------------------------------------------------------
        # PRIORITY 5: Advanced Challenge (If learner is strong)
        # -------------------------------------------------------------
        if len(recommendations) < RECOMMENDATION_LIMIT and len(strength_topic_ids) >= 2:
            recommendations.append(RecommendationSchema(
                id=f"rec_{rec_counter}",
                type=RecommendationType.RUN_SIMULATION,
                title="Advanced Simulation Challenge: Entangled Bell States",
                description="Experiment with multi-qubit correlations and phase rotations in the statevector simulator.",
                priority=60,
                reason="You have demonstrated strong conceptual foundations. Test your intuition on multi-qubit entangled states.",
                target_id="bell_state",
                action_url="/app/quantum-lab?template=bell_state",
                difficulty="intermediate"
            ))
            rec_counter += 1

        return recommendations[:RECOMMENDATION_LIMIT]
