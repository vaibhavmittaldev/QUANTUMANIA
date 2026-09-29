from typing import Optional
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.user import User
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException

def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization:
        raise UnauthorizedException("Authorization header is missing.")
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid authorization header format. Expected 'Bearer <token>'.")
    
    token = parts[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise UnauthorizedException("Invalid or expired session token.")
    
    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise UnauthorizedException("User account not found or inactive.")
    
    return user


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization:
        return None
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    token = parts[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
        
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    return user
