"""
QUANTUMANIA - Canonical Quantum Circuit Schemas
Phase 3: Quantum Circuit Builder
Strict parity with docs/QUANTUM_SCHEMA.md
"""

from enum import Enum
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator


class GateType(str, Enum):
    X = "X"
    Y = "Y"
    Z = "Z"
    H = "H"
    S = "S"
    T = "T"
    CNOT = "CNOT"
    MEASURE = "MEASURE"
    SWAP = "SWAP"
    CZ = "CZ"
    RX = "RX"
    RY = "RY"
    RZ = "RZ"


class GateParams(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    theta: Optional[float] = None
    phi: Optional[float] = None
    lambda_: Optional[float] = Field(None, alias="lambda")


class QuantumGateSchema(BaseModel):
    id: Optional[str] = None
    type: GateType
    target: Optional[int] = Field(None, ge=0, description="Single target qubit index")
    targets: Optional[List[int]] = Field(None, description="Target qubit indices")
    control: Optional[int] = Field(None, ge=0, description="Control qubit index for controlled operations")
    controls: Optional[List[int]] = Field(None, description="Control qubit indices")
    step: int = Field(0, ge=0, description="Timeline column / time slice step")
    params: Optional[GateParams] = None

    def get_effective_targets(self) -> List[int]:
        if self.targets is not None and len(self.targets) > 0:
            return self.targets
        if self.target is not None:
            return [self.target]
        return []

    def get_effective_controls(self) -> List[int]:
        if self.controls is not None and len(self.controls) > 0:
            return self.controls
        if self.control is not None:
            return [self.control]
        return []


class MeasurementMappingSchema(BaseModel):
    qubit: int = Field(..., ge=0)
    classical_bit: int = Field(..., ge=0)


class CanonicalCircuitSchema(BaseModel):
    schema_version: Literal["1.0.0"] = "1.0.0"
    id: Optional[str] = None
    name: Optional[str] = Field("Untitled Circuit", max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    qubits: int = Field(..., ge=1, le=10, description="Number of allocated qubits (1 to 10)")
    classical_bits: int = Field(0, ge=0, le=10, description="Number of classical register bits")
    gates: List[QuantumGateSchema] = Field(default_factory=list, description="Ordered sequence of gate operations")
    measurements: Optional[List[MeasurementMappingSchema]] = Field(default_factory=list)


class CircuitValidationErrorDetail(BaseModel):
    gate_id: Optional[str] = None
    gate_index: Optional[int] = None
    gate_type: Optional[str] = None
    message: str
    violation: str


class CircuitValidationResponse(BaseModel):
    is_valid: bool
    errors: List[CircuitValidationErrorDetail] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    depth: int = 0
    gate_count: int = 0
    qubits: int = 0
    classical_bits: int = 0


class CircuitTemplateSummary(BaseModel):
    id: str
    name: str
    description: str
    qubits: int
    gate_count: int
    circuit: CanonicalCircuitSchema
