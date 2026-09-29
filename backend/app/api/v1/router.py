from fastapi import APIRouter
from app.api.v1.endpoints import auth, learning

api_v1_router = APIRouter()

api_v1_router.include_router(auth.router, tags=["Authentication & Profile"])
api_v1_router.include_router(learning.router, tags=["Learning & Curriculum"])
