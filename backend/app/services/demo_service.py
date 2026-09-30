"""
QUANTUMANIA - Demo Account & Seed Service
Phase 7: Production Readiness, Validation & Final SIH Demo
Provides a safe, idempotent demo account seed with realistic learning progress,
topic mastery, simulation history, and adaptive recommendations.
"""

from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.db.models.user import User, Profile
from app.db.models.learning import LessonProgress, Lesson
from app.core.security import hash_password
from app.services.adaptive.event_service import EventService
from app.services.adaptive.mastery_engine import MasteryEngine
from app.schemas.adaptive import LearningEventCreate, LearningEventType


DEMO_EMAIL = "demo@quantumania.org"
DEMO_PASSWORD = "DemoPass123!"
DEMO_USERNAME = "demolearner"
DEMO_DISPLAY_NAME = "Quantum Explorer"


class DemoService:
    @staticmethod
    def seed_demo_account_if_needed(db: Session) -> User:
        """
        Idempotently seeds the official SIH 2026 Demo Learner account.
        Populates completed lessons, simulated circuits, tutor queries, and mastery.
        """
        existing_user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing_user:
            return existing_user

        now = datetime.now(timezone.utc)

        # 1. Create User & Profile
        user = User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            is_active=True,
            is_superuser=False,
            created_at=now - timedelta(days=5)
        )
        db.add(user)
        db.flush()

        profile = Profile(
            user_id=user.id,
            username=DEMO_USERNAME,
            display_name=DEMO_DISPLAY_NAME,
            experience_level="beginner",
            total_xp=240,
            current_streak_days=3,
            last_active_at=now
        )
        db.add(profile)
        db.flush()

        # 2. Seed Lesson Progress
        # Lesson 1: Completed 2 days ago
        lp1 = LessonProgress(
            user_id=user.id,
            lesson_id="les_01_what_is_qc",
            is_completed=True,
            started_at=now - timedelta(days=3),
            completed_at=now - timedelta(days=2)
        )
        # Lesson 2: Completed 1 day ago
        lp2 = LessonProgress(
            user_id=user.id,
            lesson_id="les_02_bits_vs_qubits",
            is_completed=True,
            started_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=1)
        )
        # Lesson 3: Started (in-progress)
        lp3 = LessonProgress(
            user_id=user.id,
            lesson_id="les_03_superposition",
            is_completed=False,
            started_at=now - timedelta(hours=3),
            completed_at=None
        )
        db.add_all([lp1, lp2, lp3])
        db.commit()

        # 3. Seed Realistic Learning Events (driving the Adaptive Engine)
        events_to_seed = [
            # Lesson 1 Completion & Assessment
            LearningEventCreate(
                event_type=LearningEventType.LESSON_COMPLETED,
                lesson_id="les_01_what_is_qc",
                topic_id="quantum_foundations",
                metadata={"time_spent_seconds": 380}
            ),
            LearningEventCreate(
                event_type=LearningEventType.QUESTION_ANSWERED,
                lesson_id="les_01_what_is_qc",
                topic_id="quantum_foundations",
                metadata={"is_correct": True, "question_id": "q1", "attempts": 1}
            ),
            LearningEventCreate(
                event_type=LearningEventType.ASSESSMENT_COMPLETED,
                lesson_id="les_01_what_is_qc",
                topic_id="quantum_foundations",
                metadata={"is_correct": True, "score": 100.0}
            ),
            # Lesson 2 Completion
            LearningEventCreate(
                event_type=LearningEventType.LESSON_COMPLETED,
                lesson_id="les_02_bits_vs_qubits",
                topic_id="qubits",
                metadata={"time_spent_seconds": 420}
            ),
            LearningEventCreate(
                event_type=LearningEventType.QUESTION_ANSWERED,
                lesson_id="les_02_bits_vs_qubits",
                topic_id="qubits",
                metadata={"is_correct": True, "question_id": "q2", "attempts": 1}
            ),
            # Circuit Simulation: Hadamard Superposition
            LearningEventCreate(
                event_type=LearningEventType.CIRCUIT_SIMULATED,
                topic_id="superposition",
                lesson_id="les_03_superposition",
                metadata={
                    "qubits": 1,
                    "gates_count": 1,
                    "shots": 1024,
                    "gates": ["H"],
                    "template": "superposition_single"
                }
            ),
            # AI Tutor interaction
            LearningEventCreate(
                event_type=LearningEventType.TUTOR_QUESTION,
                topic_id="superposition",
                lesson_id="les_03_superposition",
                metadata={"question": "Why does the Hadamard gate produce a 50/50 probability distribution?"}
            ),
            # An area needing practice: CNOT / Entanglement challenge
            LearningEventCreate(
                event_type=LearningEventType.QUESTION_ANSWERED,
                topic_id="cnot_gate",
                metadata={"is_correct": False, "reason": "Target qubit state calculation incorrect"}
            ),
            LearningEventCreate(
                event_type=LearningEventType.ASSESSMENT_COMPLETED,
                topic_id="cnot_gate",
                metadata={"is_correct": False, "score": 40.0}
            ),
        ]

        for ev in events_to_seed:
            try:
                EventService.record_event(db, user, ev)
            except Exception:
                pass

        # 4. Explicitly compute Topic Mastery for core topics
        core_topics = ["quantum_foundations", "qubits", "superposition", "cnot_gate"]
        for t in core_topics:
            try:
                MasteryEngine.update_topic_mastery(db, user.id, t)
            except Exception:
                pass

        return user
