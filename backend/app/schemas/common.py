from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class StandardSuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T

class StandardErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
