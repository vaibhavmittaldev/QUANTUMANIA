import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), nullable=False, default="beginner")  # beginner, intermediate, advanced
    is_published = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    estimated_hours = Column(Integer, default=6, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan", order_by="Module.display_order")


class Module(Base):
    __tablename__ = "modules"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan", order_by="Lesson.display_order")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    module_id = Column(String(36), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    content_markdown = Column(Text, nullable=False)
    content_json = Column(JSON, nullable=True)  # Structured content blocks (heading, text, equation, code, etc.)
    objectives_json = Column(JSON, nullable=True)  # Array of measurable learning objectives
    initial_circuit_json = Column(JSON, nullable=True)  # Canonical circuit from docs/QUANTUM_SCHEMA.md
    interactive_meta_json = Column(JSON, nullable=True)  # Future Quantum Lab metadata
    xp_reward = Column(Integer, default=25, nullable=False)
    estimated_minutes = Column(Integer, default=10, nullable=False)
    difficulty = Column(String(20), default="beginner", nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    module = relationship("Module", back_populates="lessons")
    progress_records = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")
    lab_problems = relationship("LabProblem", back_populates="lesson", cascade="all, delete-orphan", order_by="LabProblem.display_order")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_progress"),
    )

    # Relationships
    user = relationship("User")
    lesson = relationship("Lesson", back_populates="progress_records")


class LabProblem(Base):
    __tablename__ = "lab_problems"

    id = Column(String(64), primary_key=True, index=True)
    lesson_id = Column(String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(100), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    objective = Column(Text, nullable=False)
    difficulty = Column(String(20), default="beginner", nullable=False)  # beginner, intermediate, advanced
    instructions_json = Column(JSON, nullable=False)  # list of step-by-step instructions
    starter_circuit_json = Column(JSON, nullable=True)  # canonical starter circuit if any
    template_id = Column(String(50), nullable=True)
    required_gates_json = Column(JSON, nullable=True)  # ["H", "CNOT", ...]
    validation_rules_json = Column(JSON, nullable=False)  # target probabilities, required states, min_qubits, tolerances
    hints_json = Column(JSON, nullable=False)  # [hint1, hint2, hint3]
    success_criteria = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    estimated_minutes = Column(Integer, default=10, nullable=False)
    display_order = Column(Integer, default=1, nullable=False)
    xp_reward = Column(Integer, default=50, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    lesson = relationship("Lesson", back_populates="lab_problems")
    progress_records = relationship("LabProgressRecord", back_populates="lab_problem", cascade="all, delete-orphan")


class LabProgressRecord(Base):
    __tablename__ = "lab_progress"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lab_problem_id = Column(String(64), ForeignKey("lab_problems.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    best_circuit_json = Column(JSON, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "lab_problem_id", name="uq_user_lab_progress"),
    )

    # Relationships
    user = relationship("User")
    lab_problem = relationship("LabProblem", back_populates="progress_records")
