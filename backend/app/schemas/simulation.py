"""
QUANTUMANIA - Quantum Simulation Schemas
Phase 4: Multi-Engine Quantum Simulator & Framework Bridge
Strict parity with docs/QUANTUM_SCHEMA.md & QuantumLab specification
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from app.schemas.circuit import CanonicalCircuitSchema


class BackendInfoSchema(BaseModel):
    id: str = Field(..., description="Unique backend identifier")
    framework: str = Field(..., description="Framework name (e.g. Qiskit Aer, Cirq, PennyLane)")
    mode: str = Field("statevector", description="Simulation mode")
    version: Optional[str] = Field(None, description="Framework version")


class SimulationRequest(BaseModel):
    circuit: CanonicalCircuitSchema
    shots: int = Field(1024, ge=1, le=16384, description="Measurement shots (1 to 16384)")
    backend: Optional[str] = Field("qiskit", description="Simulator engine: qiskit, aer, cirq, pennylane, local, qbraid")
    mode: Optional[str] = Field("statevector", description="Simulation mode: statevector, measurement, noisy")
    noise_enabled: Optional[bool] = Field(False, description="Enable depolarizing noise model")
    step_index: Optional[int] = Field(None, description="Step index for time-sliced state evolution")


class StatevectorEntrySchema(BaseModel):
    basis: str = Field(..., description="Binary state string (e.g. '00', '01')")
    real: float = Field(..., description="Real component of complex amplitude")
    imag: float = Field(..., description="Imaginary component of complex amplitude")
    magnitude: float = Field(..., description="|amplitude| magnitude value")
    phase_rad: float = Field(..., description="Phase angle in radians [-pi, pi]")


class BlochVectorSchema(BaseModel):
    qubit: int = Field(..., ge=0, description="Qubit index")
    x: float = Field(..., description="Pauli-X expectation value")
    y: float = Field(..., description="Pauli-Y expectation value")
    z: float = Field(..., description="Pauli-Z expectation value")


class SimulationResultSchema(BaseModel):
    success: bool
    qubits: int = Field(2, description="Number of qubits in the circuit")
    depth: int = Field(0, description="Circuit depth")
    operationCount: int = Field(0, description="Total gate count")
    shots: int = Field(..., ge=1, le=16384)
    counts: Dict[str, int] = Field(default_factory=dict, description="Measurement counts histogram")
    probabilities: Dict[str, float] = Field(default_factory=dict, description="Basis state probabilities")
    statevector: List[StatevectorEntrySchema] = Field(default_factory=list)
    bloch_vectors: List[BlochVectorSchema] = Field(default_factory=list)
    execution_time_ms: float = Field(..., description="Execution time in milliseconds")
    backend: Optional[BackendInfoSchema] = Field(None, description="Backend information")
    current_step: Optional[int] = Field(None, description="Time-slice step index if simulated partially")
    noise: Optional[Dict[str, Any]] = Field(None, description="Noise configuration applied")
    explanation: Optional[str] = Field(None, description="Deterministic educational explanation")
    error: Optional[str] = Field(None, description="Error message if simulation failed")


class CompareSimulationRequest(BaseModel):
    circuit: CanonicalCircuitSchema
    frameworks: Optional[List[str]] = Field(default_factory=lambda: ["Qiskit", "PennyLane", "Cirq"])
    shots: int = Field(1024, ge=1, le=16384)


class CompareSimulationResponse(BaseModel):
    backends_tested: List[str]
    results: Dict[str, Any]
    consistent: bool
    discrepancies: List[str]
    tolerance_used: float = 0.05


class OpenQASMExportResponse(BaseModel):
    success: bool
    qasm: str
    error: Optional[str] = None


class SaveCircuitRequest(BaseModel):
    circuit: CanonicalCircuitSchema
    title: Optional[str] = None
    qiskit_code: Optional[str] = None


class SavedCircuitResponse(BaseModel):
    id: str
    title: str
    qubits: int
    classical_bits: int
    canonical: Dict[str, Any]
    qiskit_code: Optional[str] = None
    created_at: str
    updated_at: str
