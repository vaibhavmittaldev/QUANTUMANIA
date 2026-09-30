"""
QUANTUMANIA - AI Quantum Tutor Service
Phase 5: AI Quantum Tutor
Orchestrates context building, provider selection, and educational response generation
"""

from typing import Dict, Any
from app.core.config import settings
from app.schemas.tutor import TutorRequest, TutorResponse
from app.services.tutor.context_builder import ContextBuilder
from app.services.tutor.providers.base import BaseAIProvider
from app.services.tutor.providers.deterministic_provider import DeterministicTutorProvider
from app.services.tutor.providers.gemini_provider import GeminiTutorProvider
from app.services.tutor.providers.openai_provider import OpenAITutorProvider


class TutorService:
    @classmethod
    def get_provider(cls) -> BaseAIProvider:
        provider_name = (settings.AI_PROVIDER or "auto").lower()

        if provider_name == "gemini" or (provider_name == "auto" and settings.GEMINI_API_KEY):
            return GeminiTutorProvider()
        elif provider_name == "openai" or (provider_name == "auto" and settings.OPENAI_API_KEY):
            return OpenAITutorProvider()
        else:
            return DeterministicTutorProvider()

    @classmethod
    async def process_request(cls, request: TutorRequest) -> TutorResponse:
        """
        Processes a structured tutor request:
        1. Builds contextual prompt grounded in Phase 2, 3, and 4
        2. Routes to selected AI provider
        3. Enforces response format validation and graceful fallbacks
        """
        context_prompt, metadata = ContextBuilder.build_context(request)
        provider = cls.get_provider()
        
        try:
            response = await provider.generate_response(request, context_prompt, metadata)
            return response
        except Exception:
            # Absolute fallback guarantee - never crash
            fallback = DeterministicTutorProvider()
            return await fallback.generate_response(request, context_prompt, metadata)
