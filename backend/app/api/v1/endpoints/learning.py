from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.user import User
from app.api.deps import get_current_user, get_current_user_optional
from app.services.learning_service import LearningService
from app.services.lab_service import LabService
from app.schemas.learning import (
    CourseSummary,
    CourseDetail,
    ModuleSummary,
    LessonDetail,
    LessonCompleteResponse,
    LearningProgressSummary,
    LabProblemSummary,
    LabProblemDetail,
    LabValidationRequest,
    LabValidationResponse
)
from app.schemas.common import StandardSuccessResponse

router = APIRouter()

@router.get(
    "/courses",
    response_model=StandardSuccessResponse[List[CourseSummary]],
    status_code=status.HTTP_200_OK,
    summary="List all published quantum computing courses"
)
def list_courses(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    courses = LearningService.get_courses(db, current_user)
    return StandardSuccessResponse(success=True, data=courses)


@router.get(
    "/courses/{course_id}",
    response_model=StandardSuccessResponse[CourseDetail],
    status_code=status.HTTP_200_OK,
    summary="Get course syllabus, modules, and lessons"
)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    course_detail = LearningService.get_course_detail(db, course_id, current_user)
    return StandardSuccessResponse(success=True, data=course_detail)


@router.get(
    "/modules/{module_id}",
    response_model=StandardSuccessResponse[ModuleSummary],
    status_code=status.HTTP_200_OK,
    summary="Get module outline and lesson list"
)
def get_module(
    module_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    module_detail = LearningService.get_module_detail(db, module_id, current_user)
    return StandardSuccessResponse(success=True, data=module_detail)


@router.get(
    "/lessons/{lesson_id}",
    response_model=StandardSuccessResponse[LessonDetail],
    status_code=status.HTTP_200_OK,
    summary="Retrieve full lesson content, objectives, and circuit context"
)
def get_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    lesson_detail = LearningService.get_lesson_detail(db, lesson_id, current_user)
    return StandardSuccessResponse(success=True, data=lesson_detail)


@router.post(
    "/lessons/{lesson_id}/start",
    response_model=StandardSuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Record that the student started a lesson"
)
def start_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    LearningService.start_lesson(db, current_user, lesson_id)
    return StandardSuccessResponse(success=True, data={"lesson_id": lesson_id, "status": "started"})


@router.post(
    "/lessons/{lesson_id}/complete",
    response_model=StandardSuccessResponse[LessonCompleteResponse],
    status_code=status.HTTP_200_OK,
    summary="Mark lesson complete and record learning progress"
)
def complete_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = LearningService.complete_lesson(db, current_user, lesson_id)
    return StandardSuccessResponse(success=True, data=res)


@router.get(
    "/learning/progress",
    response_model=StandardSuccessResponse[LearningProgressSummary],
    status_code=status.HTTP_200_OK,
    summary="Get user learning progress and dashboard pointers"
)
@router.get(
    "/progress",
    response_model=StandardSuccessResponse[LearningProgressSummary],
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
def get_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = LearningService.get_user_learning_progress(db, current_user)
    return StandardSuccessResponse(success=True, data=progress)


@router.get(
    "/lessons/{lesson_id}/lab-problems",
    response_model=StandardSuccessResponse[List[LabProblemSummary]],
    status_code=status.HTTP_200_OK,
    summary="Get all practical quantum lab problems for a lesson"
)
def get_lesson_lab_problems(
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    problems = LabService.get_lab_problems_for_lesson(db, lesson_id, current_user)
    return StandardSuccessResponse(success=True, data=problems)


@router.get(
    "/lab-problems/{problem_id}",
    response_model=StandardSuccessResponse[LabProblemDetail],
    status_code=status.HTTP_200_OK,
    summary="Get detailed lab problem instructions, starter circuit, and hints"
)
def get_lab_problem(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    problem = LabService.get_lab_problem_detail(db, problem_id, current_user)
    return StandardSuccessResponse(success=True, data=problem)


@router.post(
    "/lab-problems/{problem_id}/validate",
    response_model=StandardSuccessResponse[LabValidationResponse],
    status_code=status.HTTP_200_OK,
    summary="Validate circuit and simulation results against lab problem requirements"
)
def validate_lab_problem(
    problem_id: str,
    payload: LabValidationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    res = LabService.validate_lab_submission(
        db,
        problem_id,
        circuit_data=payload.circuit,
        simulation_result=payload.simulation_result,
        user=current_user
    )
    return StandardSuccessResponse(success=True, data=res)
