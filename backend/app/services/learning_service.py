from datetime import datetime, timezone
from typing import List, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models.user import User, Profile
from app.db.models.learning import Course, Module, Lesson, LessonProgress
from app.schemas.learning import (
    CourseSummary,
    CourseDetail,
    ModuleSummary,
    LessonSummary,
    LessonDetail,
    LessonNavigation,
    ContentBlock,
    LessonCompleteResponse,
    LearningProgressSummary,
    ModuleProgressItem,
    RecentLessonPointer,
    CompletedLessonAudit
)
from app.services.curriculum_data import (
    CURRICULUM_COURSE,
    CURRICULUM_MODULES,
    CURRICULUM_LESSONS,
    validate_curriculum_integrity
)
from app.core.exceptions import NotFoundException

class LearningService:
    @staticmethod
    def seed_curriculum_if_needed(db: Session):
        """Seeds the 1 Course, 5 Modules, and 20 Lessons if they do not exist."""
        validate_curriculum_integrity()

        course = db.query(Course).filter(Course.id == CURRICULUM_COURSE["id"]).first()
        if not course:
            course = Course(
                id=CURRICULUM_COURSE["id"],
                title=CURRICULUM_COURSE["title"],
                slug=CURRICULUM_COURSE["slug"],
                description=CURRICULUM_COURSE["description"],
                difficulty=CURRICULUM_COURSE["difficulty"],
                is_published=CURRICULUM_COURSE["is_published"],
                display_order=CURRICULUM_COURSE["display_order"],
                estimated_hours=CURRICULUM_COURSE["estimated_hours"]
            )
            db.add(course)
            db.flush()

        for m_data in CURRICULUM_MODULES:
            mod = db.query(Module).filter(Module.id == m_data["id"]).first()
            if not mod:
                mod = Module(
                    id=m_data["id"],
                    course_id=m_data["course_id"],
                    title=m_data["title"],
                    slug=m_data["slug"],
                    description=m_data["description"],
                    display_order=m_data["display_order"]
                )
                db.add(mod)
                db.flush()

        for l_data in CURRICULUM_LESSONS:
            les = db.query(Lesson).filter(Lesson.id == l_data["id"]).first()
            if not les:
                les = Lesson(
                    id=l_data["id"],
                    module_id=l_data["module_id"],
                    title=l_data["title"],
                    slug=l_data["slug"],
                    description=l_data["description"],
                    content_markdown=l_data["content_markdown"],
                    content_json=l_data["content_blocks"],
                    objectives_json=l_data["objectives"],
                    initial_circuit_json=l_data["initial_circuit_json"],
                    interactive_meta_json=l_data["interactive_meta_json"],
                    xp_reward=l_data["xp_reward"],
                    estimated_minutes=l_data["estimated_minutes"],
                    difficulty=l_data["difficulty"],
                    display_order=l_data["display_order"]
                )
                db.add(les)

        db.commit()

    @staticmethod
    def _get_completed_lesson_ids(db: Session, user: Optional[User]) -> Set[str]:
        if not user:
            return set()
        records = db.query(LessonProgress.lesson_id).filter(
            LessonProgress.user_id == user.id,
            LessonProgress.is_completed == True
        ).all()
        return {r[0] for r in records}

    @staticmethod
    def get_courses(db: Session, user: Optional[User] = None) -> List[CourseSummary]:
        courses = db.query(Course).filter(Course.is_published == True).order_by(Course.display_order).all()
        completed_ids = LearningService._get_completed_lesson_ids(db, user)

        result = []
        for c in courses:
            total_lessons = 0
            for m in c.modules:
                total_lessons += len(m.lessons)

            completed_lessons = sum(1 for m in c.modules for l in m.lessons if l.id in completed_ids)
            progress_pct = round((completed_lessons / total_lessons * 100), 1) if total_lessons > 0 else 0.0

            result.append(CourseSummary(
                id=c.id,
                title=c.title,
                slug=c.slug,
                description=c.description,
                difficulty=c.difficulty,
                estimated_hours=c.estimated_hours,
                total_modules=len(c.modules),
                total_lessons=total_lessons,
                completed_lessons=completed_lessons,
                progress_percent=progress_pct
            ))
        return result

    @staticmethod
    def get_course_detail(db: Session, course_id_or_slug: str, user: Optional[User] = None) -> CourseDetail:
        course = db.query(Course).filter(
            (Course.id == course_id_or_slug) | (Course.slug == course_id_or_slug)
        ).first()
        if not course:
            raise NotFoundException(f"Course '{course_id_or_slug}' not found.")

        completed_ids = LearningService._get_completed_lesson_ids(db, user)

        module_summaries = []
        total_course_lessons = 0
        total_course_completed = 0

        for m in sorted(course.modules, key=lambda x: x.display_order):
            lessons = sorted(m.lessons, key=lambda x: x.display_order)
            mod_completed = sum(1 for l in lessons if l.id in completed_ids)
            mod_total = len(lessons)
            mod_pct = round((mod_completed / mod_total * 100), 1) if mod_total > 0 else 0.0

            total_course_lessons += mod_total
            total_course_completed += mod_completed

            lesson_summaries = [
                LessonSummary(
                    id=l.id,
                    module_id=l.module_id,
                    title=l.title,
                    slug=l.slug,
                    description=l.description,
                    estimated_minutes=l.estimated_minutes,
                    difficulty=l.difficulty,
                    xp_reward=l.xp_reward,
                    display_order=l.display_order,
                    is_completed=l.id in completed_ids,
                    has_interactive_circuit=bool(l.initial_circuit_json or l.interactive_meta_json)
                )
                for l in lessons
            ]

            module_summaries.append(ModuleSummary(
                id=m.id,
                course_id=m.course_id,
                title=m.title,
                slug=m.slug,
                description=m.description,
                display_order=m.display_order,
                total_lessons=mod_total,
                completed_lessons=mod_completed,
                progress_percent=mod_pct,
                lessons=lesson_summaries
            ))

        course_progress_pct = round((total_course_completed / total_course_lessons * 100), 1) if total_course_lessons > 0 else 0.0

        return CourseDetail(
            id=course.id,
            title=course.title,
            slug=course.slug,
            description=course.description,
            difficulty=course.difficulty,
            estimated_hours=course.estimated_hours,
            total_modules=len(course.modules),
            total_lessons=total_course_lessons,
            completed_lessons=total_course_completed,
            progress_percent=course_progress_pct,
            modules=module_summaries
        )

    @staticmethod
    def get_module_detail(db: Session, module_id_or_slug: str, user: Optional[User] = None) -> ModuleSummary:
        module = db.query(Module).filter(
            (Module.id == module_id_or_slug) | (Module.slug == module_id_or_slug)
        ).first()
        if not module:
            raise NotFoundException(f"Module '{module_id_or_slug}' not found.")

        completed_ids = LearningService._get_completed_lesson_ids(db, user)
        lessons = sorted(module.lessons, key=lambda x: x.display_order)
        mod_completed = sum(1 for l in lessons if l.id in completed_ids)
        mod_total = len(lessons)
        mod_pct = round((mod_completed / mod_total * 100), 1) if mod_total > 0 else 0.0

        lesson_summaries = [
            LessonSummary(
                id=l.id,
                module_id=l.module_id,
                title=l.title,
                slug=l.slug,
                description=l.description,
                estimated_minutes=l.estimated_minutes,
                difficulty=l.difficulty,
                xp_reward=l.xp_reward,
                display_order=l.display_order,
                is_completed=l.id in completed_ids,
                has_interactive_circuit=bool(l.initial_circuit_json or l.interactive_meta_json)
            )
            for l in lessons
        ]

        return ModuleSummary(
            id=module.id,
            course_id=module.course_id,
            title=module.title,
            slug=module.slug,
            description=module.description,
            display_order=module.display_order,
            total_lessons=mod_total,
            completed_lessons=mod_completed,
            progress_percent=mod_pct,
            lessons=lesson_summaries
        )

    @staticmethod
    def get_lesson_detail(db: Session, lesson_id: str, user: Optional[User] = None) -> LessonDetail:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise NotFoundException(f"Lesson '{lesson_id}' not found.")

        # Compute sequential navigation across all lessons in the course
        all_lessons = db.query(Lesson).join(Module).filter(
            Module.course_id == lesson.module.course_id
        ).order_by(Module.display_order, Lesson.display_order).all()

        current_idx = -1
        for idx, l in enumerate(all_lessons):
            if l.id == lesson.id:
                current_idx = idx
                break

        prev_id = all_lessons[current_idx - 1].id if current_idx > 0 else None
        next_id = all_lessons[current_idx + 1].id if current_idx < len(all_lessons) - 1 else None

        is_completed = False
        if user:
            prog = db.query(LessonProgress).filter(
                LessonProgress.user_id == user.id,
                LessonProgress.lesson_id == lesson.id
            ).first()
            if prog and prog.is_completed:
                is_completed = True

        blocks_raw = lesson.content_json or []
        content_blocks = [
            ContentBlock(
                type=b.get("type", "text"),
                content=b.get("content"),
                title=b.get("title"),
                variant=b.get("variant"),
                language=b.get("language"),
                items=b.get("items")
            )
            for b in blocks_raw
        ]

        return LessonDetail(
            id=lesson.id,
            module_id=lesson.module_id,
            module_title=lesson.module.title,
            course_id=lesson.module.course_id,
            title=lesson.title,
            slug=lesson.slug,
            description=lesson.description,
            estimated_minutes=lesson.estimated_minutes,
            difficulty=lesson.difficulty,
            xp_reward=lesson.xp_reward,
            display_order=lesson.display_order,
            objectives=lesson.objectives_json or [],
            content_blocks=content_blocks,
            content_markdown=lesson.content_markdown,
            initial_circuit=lesson.initial_circuit_json,
            interactive=lesson.interactive_meta_json,
            is_completed=is_completed,
            navigation=LessonNavigation(
                previous_lesson_id=prev_id,
                next_lesson_id=next_id
            )
        )

    @staticmethod
    def start_lesson(db: Session, user: User, lesson_id: str):
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise NotFoundException(f"Lesson '{lesson_id}' not found.")

        progress = db.query(LessonProgress).filter(
            LessonProgress.user_id == user.id,
            LessonProgress.lesson_id == lesson_id
        ).first()

        if not progress:
            progress = LessonProgress(
                user_id=user.id,
                lesson_id=lesson_id,
                is_completed=False,
                started_at=datetime.now(timezone.utc)
            )
            db.add(progress)
            db.commit()

        # Phase 6: Learning Event Tracking
        try:
            from app.services.adaptive.event_service import EventService
            from app.schemas.adaptive import LearningEventCreate, LearningEventType
            EventService.record_event(
                db,
                user,
                LearningEventCreate(
                    event_type=LearningEventType.LESSON_STARTED,
                    lesson_id=lesson_id
                )
            )
        except Exception:
            pass

    @staticmethod
    def complete_lesson(db: Session, user: User, lesson_id: str) -> LessonCompleteResponse:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise NotFoundException(f"Lesson '{lesson_id}' not found.")

        progress = db.query(LessonProgress).filter(
            LessonProgress.user_id == user.id,
            LessonProgress.lesson_id == lesson_id
        ).first()

        now = datetime.now(timezone.utc)
        xp_awarded = 0

        if not progress:
            progress = LessonProgress(
                user_id=user.id,
                lesson_id=lesson_id,
                is_completed=True,
                started_at=now,
                completed_at=now
            )
            db.add(progress)
            xp_awarded = lesson.xp_reward
        else:
            if not progress.is_completed:
                progress.is_completed = True
                progress.completed_at = now
                xp_awarded = lesson.xp_reward

        # Award XP to user's profile if newly completed
        if xp_awarded > 0 and user.profile:
            user.profile.total_xp += xp_awarded

        db.commit()

        # Phase 6: Learning Event Tracking & Topic Mastery Update
        try:
            from app.services.adaptive.event_service import EventService
            from app.schemas.adaptive import LearningEventCreate, LearningEventType
            EventService.record_event(
                db,
                user,
                LearningEventCreate(
                    event_type=LearningEventType.LESSON_COMPLETED,
                    lesson_id=lesson_id,
                    metadata={"xp_awarded": xp_awarded}
                )
            )
        except Exception:
            pass

        # Find next lesson in sequence
        all_lessons = db.query(Lesson).join(Module).filter(
            Module.course_id == lesson.module.course_id
        ).order_by(Module.display_order, Lesson.display_order).all()

        current_idx = -1
        for idx, l in enumerate(all_lessons):
            if l.id == lesson.id:
                current_idx = idx
                break

        next_id = all_lessons[current_idx + 1].id if current_idx < len(all_lessons) - 1 else None

        # Course progress calculation
        completed_count = db.query(func.count(LessonProgress.id)).filter(
            LessonProgress.user_id == user.id,
            LessonProgress.is_completed == True
        ).scalar() or 0
        total_count = len(all_lessons)
        progress_pct = round((completed_count / total_count * 100), 1) if total_count > 0 else 0.0

        return LessonCompleteResponse(
            lesson_id=lesson_id,
            is_completed=True,
            xp_awarded=xp_awarded,
            next_lesson_id=next_id,
            course_progress_percent=progress_pct
        )

    @staticmethod
    def get_user_learning_progress(db: Session, user: User) -> LearningProgressSummary:
        course = db.query(Course).first()
        if not course:
            return LearningProgressSummary()

        completed_records = db.query(LessonProgress).filter(
            LessonProgress.user_id == user.id,
            LessonProgress.is_completed == True
        ).all()
        completed_ids = {r.lesson_id for r in completed_records}

        all_lessons = db.query(Lesson).join(Module).filter(
            Module.course_id == course.id
        ).order_by(Module.display_order, Lesson.display_order).all()

        total_lessons = len(all_lessons)
        completed_lessons_count = sum(1 for l in all_lessons if l.id in completed_ids)
        course_pct = round((completed_lessons_count / total_lessons * 100), 1) if total_lessons > 0 else 0.0

        # Modules progress
        modules_progress = []
        for m in sorted(course.modules, key=lambda x: x.display_order):
            m_total = len(m.lessons)
            m_comp = sum(1 for l in m.lessons if l.id in completed_ids)
            m_pct = round((m_comp / m_total * 100), 1) if m_total > 0 else 0.0
            modules_progress.append(ModuleProgressItem(
                module_id=m.id,
                title=m.title,
                total_lessons=m_total,
                completed_lessons=m_comp,
                progress_percent=m_pct
            ))

        # Recent incomplete lesson for "Continue Learning"
        recent_incomplete = None
        for idx, l in enumerate(all_lessons):
            if l.id not in completed_ids:
                recent_incomplete = RecentLessonPointer(
                    lesson_id=l.id,
                    title=l.title,
                    module_id=l.module_id,
                    module_title=l.module.title,
                    display_order=l.display_order,
                    estimated_minutes=l.estimated_minutes
                )
                break

        # Recently completed audit
        recent_completed_records = db.query(LessonProgress).filter(
            LessonProgress.user_id == user.id,
            LessonProgress.is_completed == True
        ).order_by(LessonProgress.completed_at.desc()).limit(5).all()

        recently_completed = []
        for r in recent_completed_records:
            if r.lesson:
                recently_completed.append(CompletedLessonAudit(
                    lesson_id=r.lesson.id,
                    title=r.lesson.title,
                    module_title=r.lesson.module.title,
                    completed_at=r.completed_at or r.started_at
                ))

        total_xp = user.profile.total_xp if user.profile else 0

        return LearningProgressSummary(
            total_xp=total_xp,
            completed_lessons_count=completed_lessons_count,
            total_lessons_count=total_lessons,
            course_progress_percent=course_pct,
            modules_progress=modules_progress,
            recent_incomplete_lesson=recent_incomplete,
            recently_completed_lessons=recently_completed
        )
