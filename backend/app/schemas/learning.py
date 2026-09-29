from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

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
