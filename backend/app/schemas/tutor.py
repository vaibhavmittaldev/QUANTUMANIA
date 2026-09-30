"""
QUANTUMANIA - AI Quantum Tutor Schemas
Phase 5: AI Quantum Tutor
Structured request/response contracts adhering to educational constraints
"""

from enum import Enum
from typing import List, Dict, Optional, Literal, Any
from pydantic import BaseModel, Field
from app.schemas.circuit import CanonicalCircuitSchema


class TutorMode(str, Enum):
    EXPLAIN = "explain"
    HINT = "hint"
    ASK = "ask"
    GUIDE = "guide"
    ANALYZE = "analyze"


class TutorRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class TutorMessageSchema(BaseModel):
    role: TutorRole
    content: str = Field(..., max_length=5000, description="Chat message text")
    timestamp: Optional[str] = None


class LessonContextSchema(BaseModel):
    lesson_id: Optional[str] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    objectives: Optional[List[str]] = Field(default_factory=list)
    difficulty: Optional[str] = None


class CircuitContextSchema(BaseModel):
    qubits: int = Field(1, ge=1, le=10, description="Allocated qubits")
    depth: int = Field(0, ge=0, description="Circuit time-slice depth")
    gate_count: int = Field(0, ge=0, description="Total operations")
    gates_summary: List[str] = Field(default_factory=list, description="Human-readable gate sequence")
    circuit: Optional[CanonicalCircuitSchema] = None


class SimulationContextSchema(BaseModel):
    has_simulation: bool = Field(False, description="Whether simulation results exist")
    is_stale: bool = Field(False, description="True if circuit was modified after simulation")
    shots: Optional[int] = Field(None, ge=1, le=8192)
    probabilities: Optional[Dict[str, float]] = Field(default_factory=dict)
    counts: Optional[Dict[str, int]] = Field(default_factory=dict)
    dominant_states: Optional[List[str]] = Field(default_factory=list)
    bloch_vectors: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class TutorRequest(BaseModel):
    mode: TutorMode = Field(default=TutorMode.ASK, description="Tutoring interaction mode")
    message: Optional[str] = Field(None, max_length=2000, description="Learner prompt or question")
    hint_level: Optional[int] = Field(1, ge=1, le=3, description="Progressive hint depth: 1=conceptual, 2=specific, 3=solution-guiding")
    lesson_context: Optional[LessonContextSchema] = None
    circuit_context: Optional[CircuitContextSchema] = None
    simulation_context: Optional[SimulationContextSchema] = None
    conversation: Optional[List[TutorMessageSchema]] = Field(default_factory=list)


class TutorResponse(BaseModel):
    message: str = Field(..., description="Educational explanation formatted in clean Markdown with quantum notation")
    mode: TutorMode = Field(..., description="Active tutor mode")
    key_points: Optional[List[str]] = Field(default_factory=list, description="Core takeaways")
    next_step: Optional[str] = Field(None, description="Recommended next action in Quantum Lab")
    follow_up_question: Optional[str] = Field(None, description="Socratic question to stimulate reflection")
    context_used: Dict[str, Any] = Field(default_factory=dict, description="Metadata on contextual grounding used")
