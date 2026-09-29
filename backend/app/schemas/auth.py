from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Valid email address")
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$", description="Alphanumeric username")
    password: str = Field(..., min_length=8, max_length=128, description="Password at least 8 characters")
    display_name: Optional[str] = Field(None, max_length=100)

class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")

class AuthTokenData(BaseModel):
    user_id: str
    email: str
    username: str
    token: str
    token_type: str = "Bearer"
    expires_in: int

class UserProfileData(BaseModel):
    user_id: str
    email: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    experience_level: str = "beginner"
    points: int = 0
    current_streak_days: int = 0
    created_at: datetime

class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    experience_level: Optional[str] = Field(None, pattern=r"^(beginner|intermediate|advanced)$")
    avatar_url: Optional[str] = Field(None, max_length=500)
