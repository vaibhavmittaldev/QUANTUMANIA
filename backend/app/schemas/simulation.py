"""
QUANTUMANIA - Quantum Simulation Schemas
Phase 4: Quantum Simulator
Strict parity with docs/QUANTUM_SCHEMA.md Section 8
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from app.schemas.circuit import CanonicalCircuitSchema


class SimulationRequest(BaseModel):
    circuit: CanonicalCircuitSchema
    shots: int = Field(1024, ge=1, le=8192, description="Measurement shots (1 to 8192)")


class StatevectorEntrySchema(BaseModel):
    basis: str = Field(..., description="Binary state string (e.g. '00', '01')")
    real: float = Field(..., description="Real component of complex amplitude")
    imag: float = Field(..., description="Imaginary component of complex amplitude")
    magnitude: float = Field(..., description="|amplitude|^2 probability value")
    phase_rad: float = Field(..., description="Phase angle in radians [-pi, pi]")


class BlochVectorSchema(BaseModel):
    qubit: int = Field(..., ge=0, description="Qubit index")
    x: float = Field(..., description="Pauli-X expectation value")
    y: float = Field(..., description="Pauli-Y expectation value")
    z: float = Field(..., description="Pauli-Z expectation value")


class SimulationResultSchema(BaseModel):
    success: bool
    shots: int = Field(..., ge=1, le=8192)
    counts: Dict[str, int] = Field(default_factory=dict, description="Measurement counts histogram")
    probabilities: Dict[str, float] = Field(default_factory=dict, description="Basis state probabilities")
    statevector: List[StatevectorEntrySchema] = Field(default_factory=list)
    bloch_vectors: List[BlochVectorSchema] = Field(default_factory=list)
    execution_time_ms: float = Field(..., description="Execution time in milliseconds")
    explanation: Optional[str] = Field(None, description="Deterministic educational explanation")
    error: Optional[str] = Field(None, description="Error message if simulation failed")
