"""
QUANTUMANIA - Base AI Provider Abstraction
Phase 5: AI Quantum Tutor
Defines pluggable provider interface
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
from app.schemas.tutor import TutorRequest, TutorResponse


class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        request: TutorRequest,
        context_prompt: str,
        metadata: Dict[str, Any]
    ) -> TutorResponse:
        """
        Generates structured educational tutor response.
        """
        pass
