from typing import Tuple
from sqlalchemy.orm import Session
from app.db.models.user import User, Profile
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, UserProfileData, ProfileUpdateRequest
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import AccountAlreadyExistsException, InvalidCredentialsException, NotFoundException
from app.core.config import settings

class AuthService:
    @staticmethod
    def register_user(db: Session, req: UserRegisterRequest) -> Tuple[User, Profile, str]:
        # Check if email already registered
        existing_email = db.query(User).filter(User.email == req.email.lower().strip()).first()
        if existing_email:
            raise AccountAlreadyExistsException("An account with this email address already exists.")
        
        # Check if username already taken
        clean_username = req.username.strip()
        existing_username = db.query(Profile).filter(Profile.username == clean_username).first()
        if existing_username:
            raise AccountAlreadyExistsException("An account with this username already exists.")
        
        # Hash password
        hashed_pw = hash_password(req.password)
        
        # Create user
        user = User(
            email=req.email.lower().strip(),
            hashed_password=hashed_pw,
            is_active=True,
            is_superuser=False
        )
        db.add(user)
        db.flush()  # populate user.id
        
        # Create profile
        profile = Profile(
            user_id=user.id,
            username=clean_username,
            display_name=req.display_name.strip() if req.display_name else clean_username,
            experience_level="beginner",
            total_xp=0,
            current_streak_days=1
        )
        db.add(profile)
        db.commit()
        db.refresh(user)
        db.refresh(profile)
        
        # Issue JWT
        token = create_access_token(subject=user.id)
        return user, profile, token

    @staticmethod
    def authenticate_user(db: Session, req: UserLoginRequest) -> Tuple[User, Profile, str]:
        user = db.query(User).filter(User.email == req.email.lower().strip()).first()
        if not user:
            raise InvalidCredentialsException("Invalid email or password.")
        
        if not verify_password(req.password, user.hashed_password):
            raise InvalidCredentialsException("Invalid email or password.")
        
        if not user.is_active:
            raise InvalidCredentialsException("Account is disabled. Please contact support.")
        
        profile = db.query(Profile).filter(Profile.user_id == user.id).first()
        if not profile:
            raise NotFoundException("User profile not found.")
        
        token = create_access_token(subject=user.id)
        return user, profile, token

    @staticmethod
    def get_profile_data(user: User) -> UserProfileData:
        profile = user.profile
        return UserProfileData(
            user_id=user.id,
            email=user.email,
            username=profile.username if profile else "",
            display_name=profile.display_name if profile else None,
            avatar_url=profile.avatar_url if profile else None,
            experience_level=profile.experience_level if profile else "beginner",
            points=profile.total_xp if profile else 0,
            current_streak_days=profile.current_streak_days if profile else 0,
            created_at=user.created_at
        )

    @staticmethod
    def update_profile(db: Session, user: User, update: ProfileUpdateRequest) -> UserProfileData:
        profile = user.profile
        if not profile:
            raise NotFoundException("User profile not found.")
        
        if update.display_name is not None:
            profile.display_name = update.display_name.strip()
        if update.experience_level is not None:
            profile.experience_level = update.experience_level
        if update.avatar_url is not None:
            profile.avatar_url = update.avatar_url
            
        db.commit()
        db.refresh(profile)
        return AuthService.get_profile_data(user)
