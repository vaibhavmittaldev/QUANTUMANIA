from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, model_validator

class ContentBlock(BaseModel):
    type: str  # heading, subheading, text, callout, equation, code, bullet_list, numbered_list, example
    content: Optional[str] = None
    title: Optional[str] = None
    variant: Optional[str] = None  # info, tip, warning, formula
    language: Optional[str] = None
    items: Optional[List[str]] = None

class LessonNavigation(BaseModel):
    previous_lesson_id: Optional[str] = None
    next_lesson_id: Optional[str] = None

class LessonSummary(BaseModel):
    id: str
    module_id: str
    title: str
    slug: str
    description: Optional[str] = None
    estimated_minutes: int = 10
    difficulty: str = "beginner"
    xp_reward: int = 25
    display_order: int
    is_completed: bool = False
    has_interactive_circuit: bool = False
    has_lab_practice: bool = False
    lab_problem_count: int = 0

class ModuleSummary(BaseModel):
    id: str
    course_id: str
    title: str
    slug: str
    description: Optional[str] = None
    display_order: int
    total_lessons: int = 0
    completed_lessons: int = 0
    progress_percent: float = 0.0
    lessons: List[LessonSummary] = Field(default_factory=list)

class CourseSummary(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    difficulty: str
    estimated_hours: int = 6
    total_modules: int = 0
    total_lessons: int = 0
    completed_lessons: int = 0
    progress_percent: float = 0.0

class CourseDetail(CourseSummary):
    modules: List[ModuleSummary] = Field(default_factory=list)

class LabProblemSummary(BaseModel):
    id: str
    lesson_id: str
    topic_id: str
    title: str
    description: str
    objective: str
    difficulty: str
    estimated_minutes: int = 10
    display_order: int = 1
    xp_reward: int = 50
    template_id: Optional[str] = None
    is_completed: bool = False

class LabProblemDetail(LabProblemSummary):
    instructions: List[str] = Field(default_factory=list)
    starter_circuit: Optional[Dict[str, Any]] = None
    starter_circuit_data: Optional[Dict[str, Any]] = None
    required_gates: Optional[List[str]] = None
    validation_rules: Dict[str, Any] = Field(default_factory=dict)
    hints: List[str] = Field(default_factory=list)
    success_criteria: str
    explanation: str

class LabValidationRequest(BaseModel):
    circuit: Dict[str, Any]
    simulation_result: Optional[Dict[str, Any]] = None

class LabValidationCheckResult(BaseModel):
    name: str
    passed: bool
    message: str
    details: Optional[str] = None

class LabValidationResponse(BaseModel):
    lab_problem_id: str
    problem_id: Optional[str] = None
    passed: bool
    is_valid: bool = False
    score: float = 0.0
    message: str
    feedback: Optional[str] = None
    explanation: str
    checks: List[LabValidationCheckResult] = Field(default_factory=list)
    xp_awarded: int = 0
    is_completed: bool = False
    next_problem_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_validity_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "is_valid" not in data and "passed" in data:
                data["is_valid"] = data["passed"]
            elif "passed" not in data and "is_valid" in data:
                data["passed"] = data["is_valid"]
            if "feedback" not in data and "message" in data:
                data["feedback"] = data["message"]
            if "problem_id" not in data and "lab_problem_id" in data:
                data["problem_id"] = data["lab_problem_id"]
        return data

class LessonDetail(BaseModel):
    id: str
    module_id: str
    module_title: str
    course_id: str
    title: str
    slug: str
    description: Optional[str] = None
    estimated_minutes: int = 10
    difficulty: str = "beginner"
    xp_reward: int = 25
    display_order: int
    objectives: List[str] = Field(default_factory=list)
    content_blocks: List[ContentBlock] = Field(default_factory=list)
    content_markdown: str = ""
    initial_circuit: Optional[Dict[str, Any]] = None
    interactive: Optional[Dict[str, Any]] = None
    is_completed: bool = False
    navigation: LessonNavigation
    has_lab_practice: bool = False
    lab_problems: List[LabProblemSummary] = Field(default_factory=list)

class LessonCompleteResponse(BaseModel):
    lesson_id: str
    is_completed: bool = True
    xp_awarded: int = 0
    next_lesson_id: Optional[str] = None
    course_progress_percent: float = 0.0

class ModuleProgressItem(BaseModel):
    module_id: str
    title: str
    total_lessons: int
    completed_lessons: int
    progress_percent: float

class RecentLessonPointer(BaseModel):
    lesson_id: str
    title: str
    module_id: str
    module_title: str
    display_order: int
    estimated_minutes: int

class CompletedLessonAudit(BaseModel):
    lesson_id: str
    title: str
    module_title: str
    completed_at: datetime

class LearningProgressSummary(BaseModel):
    total_xp: int = 0
    completed_lessons_count: int = 0
    total_lessons_count: int = 20
    course_progress_percent: float = 0.0
    modules_progress: List[ModuleProgressItem] = Field(default_factory=list)
    recent_incomplete_lesson: Optional[RecentLessonPointer] = None
    recently_completed_lessons: List[CompletedLessonAudit] = Field(default_factory=list)
