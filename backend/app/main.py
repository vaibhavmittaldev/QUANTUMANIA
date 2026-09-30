from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.exceptions import AppException
from app.db.base import Base, engine, SessionLocal
from app.db.models.user import User, Profile
from app.db.models.learning import Course, Module, Lesson, LessonProgress
from app.db.models.adaptive import LearningEventModel, TopicMasteryModel
from app.services.learning_service import LearningService
from app.services.demo_service import DemoService
from app.api.v1.router import api_v1_router
from app.schemas.common import StandardErrorResponse, ErrorDetail

# Initialize tables
Base.metadata.create_all(bind=engine)

# Seed canonical curriculum and demo learner
_db = SessionLocal()
try:
    LearningService.seed_curriculum_if_needed(_db)
    DemoService.seed_demo_account_if_needed(_db)
finally:
    _db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for AI-Based Interactive Quantum Algorithm Learning Platform"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers enforcing unified response format
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content=StandardErrorResponse(
            success=False,
            error=ErrorDetail(
                code=exc.code,
                message=exc.message,
                details=exc.details
            )
        ).model_dump()
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    msg = first_error.get("msg", "Invalid request body.")
    loc = " -> ".join([str(l) for l in first_error.get("loc", [])])
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=StandardErrorResponse(
            success=False,
            error=ErrorDetail(
                code="VALIDATION_ERROR",
                message=f"Validation error: {msg} (at {loc})",
                details=errors
            )
        ).model_dump()
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = "HTTP_ERROR"
    if exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 404:
        code = "NOT_FOUND"

    return JSONResponse(
        status_code=exc.status_code,
        content=StandardErrorResponse(
            success=False,
            error=ErrorDetail(
                code=code,
                message=str(exc.detail) if exc.detail else "An HTTP error occurred."
            )
        ).model_dump()
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=StandardErrorResponse(
            success=False,
            error=ErrorDetail(
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected server error occurred. Please try again later."
            )
        ).model_dump()
    )

# Routes
app.include_router(api_v1_router, prefix="/api/v1")
app.include_router(api_v1_router)  # Direct /auth/register, /courses, /lessons support

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "project": settings.PROJECT_NAME, "version": settings.VERSION}
