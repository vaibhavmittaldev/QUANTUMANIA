from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.user import User
from app.api.deps import get_current_user
from app.services.auth_service import AuthService
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthTokenData,
    UserProfileData,
    ProfileUpdateRequest
)
from app.schemas.common import StandardSuccessResponse
from app.core.config import settings

router = APIRouter()

@router.post(
    "/auth/register",
    response_model=StandardSuccessResponse[AuthTokenData],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new learner account"
)
def register(
    req: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    user, profile, token = AuthService.register_user(db, req)
    return StandardSuccessResponse(
        success=True,
        data=AuthTokenData(
            user_id=user.id,
            email=user.email,
            username=profile.username,
            token=token,
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    )

@router.post(
    "/auth/login",
    response_model=StandardSuccessResponse[AuthTokenData],
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and obtain JWT token"
)
def login(
    req: UserLoginRequest,
    db: Session = Depends(get_db)
):
    user, profile, token = AuthService.authenticate_user(db, req)
    return StandardSuccessResponse(
        success=True,
        data=AuthTokenData(
            user_id=user.id,
            email=user.email,
            username=profile.username,
            token=token,
            token_type="Bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    )

@router.get(
    "/me",
    response_model=StandardSuccessResponse[UserProfileData],
    status_code=status.HTTP_200_OK,
    summary="Get current user profile and account details"
)
@router.get(
    "/auth/me",
    response_model=StandardSuccessResponse[UserProfileData],
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    profile_data = AuthService.get_profile_data(current_user)
    return StandardSuccessResponse(
        success=True,
        data=profile_data
    )

@router.put(
    "/me",
    response_model=StandardSuccessResponse[UserProfileData],
    status_code=status.HTTP_200_OK,
    summary="Update current user profile"
)
@router.put(
    "/auth/me",
    response_model=StandardSuccessResponse[UserProfileData],
    status_code=status.HTTP_200_OK,
    include_in_schema=False
)
def update_me(
    update_req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_profile = AuthService.update_profile(db, current_user, update_req)
    return StandardSuccessResponse(
        success=True,
        data=updated_profile
    )
