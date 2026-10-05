"""
QUANTUMANIA - Base Quantum Simulation Framework
Abstract base class and mathematical transformations for multi-backend execution.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import numpy as np
import math

from app.schemas.simulation import (
    CanonicalCircuitSchema,
    SimulationResultSchema,
    StatevectorEntrySchema,
    BlochVectorSchema,
    BackendInfoSchema
)


class BaseSimulationBackend(ABC):
    """Abstract interface implemented by all quantum simulation engine adapters."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Identifier for the framework adapter."""
        pass

    @property
    @abstractmethod
    def framework(self) -> str:
        """Human-readable framework name (e.g. Qiskit Aer, Cirq, PennyLane)."""
        pass

    @abstractmethod
    async def simulate(
        self,
        circuit: CanonicalCircuitSchema,
        shots: int = 1024,
        mode: str = "statevector",
        noise_enabled: bool = False,
        step_index: Optional[int] = None
    ) -> SimulationResultSchema:
        """Simulate canonical circuit on the specific engine."""
        pass

    @staticmethod
    def parse_angle(param_value: Any) -> float:
        """Parse rotation angle theta from float, int, or common string representation."""
        if param_value is None:
            return 0.0
        if isinstance(param_value, (int, float)):
            return float(param_value)
        val_str = str(param_value).strip().lower()
        if val_str in ("pi", "π"):
            return math.pi
        if val_str in ("pi/2", "π/2", "0.5pi"):
            return math.pi / 2.0
        if val_str in ("pi/4", "π/4", "0.25pi"):
            return math.pi / 4.0
        if val_str in ("3pi/2", "3π/2", "1.5pi"):
            return 1.5 * math.pi
        if val_str in ("2pi", "2π"):
            return 2.0 * math.pi
        try:
            return float(val_str)
        except ValueError:
            return 0.0

    @staticmethod
    def statevector_to_entries(statevector: np.ndarray, num_qubits: int) -> List[StatevectorEntrySchema]:
        """Convert a complex statevector into canonical StatevectorEntrySchema entries."""
        entries: List[StatevectorEntrySchema] = []
        dim = len(statevector)
        for i in range(dim):
            basis_str = format(i, f"0{num_qubits}b")
            val = complex(statevector[i])
            real = float(val.real)
            imag = float(val.imag)
            magnitude = float(abs(val))
            phase_rad = float(np.angle(val)) if magnitude > 1e-9 else 0.0

            entries.append(
                StatevectorEntrySchema(
                    basis=basis_str,
                    real=round(real, 6),
                    imag=round(imag, 6),
                    magnitude=round(magnitude, 6),
                    phase_rad=round(phase_rad, 6)
                )
            )
        return entries

    @staticmethod
    def calculate_bloch_vectors(statevector: np.ndarray, num_qubits: int) -> List[BlochVectorSchema]:
        """
        Calculate Bloch sphere coordinates (x, y, z) for each single qubit
        by partial tracing the full pure state density matrix.
        """
        bloch_vectors: List[BlochVectorSchema] = []
        dim = 1 << num_qubits

        for q in range(num_qubits):
            shift = num_qubits - 1 - q

            rho00 = 0.0
            rho11 = 0.0
            rho01 = 0.0 + 0.0j

            for i in range(dim):
                bit = (i >> shift) & 1
                amp_i = statevector[i]
                if bit == 0:
                    rho00 += float(abs(amp_i) ** 2)
                    partner = i | (1 << shift)
                    amp_partner = statevector[partner]
                    rho01 += amp_i * np.conj(amp_partner)
                else:
                    rho11 += float(abs(amp_i) ** 2)

            x = float(2.0 * rho01.real)
            y = float(-2.0 * rho01.imag)
            z = float(rho00 - rho11)

            bloch_vectors.append(
                BlochVectorSchema(
                    qubit=q,
                    x=round(x, 4),
                    y=round(y, 4),
                    z=round(z, 4)
                )
            )

        return bloch_vectors

    @staticmethod
    def sample_counts_from_probabilities(
        probabilities: Dict[str, float],
        shots: int
    ) -> Dict[str, int]:
        """Generate stochastic measurement counts via multinomial sampling."""
        keys = list(probabilities.keys())
        p_vals = np.array([probabilities[k] for k in keys], dtype=float)
        p_sum = np.sum(p_vals)
        if p_sum > 0:
            p_vals = p_vals / p_sum
        else:
            p_vals = np.ones(len(keys)) / len(keys)

        sampled = np.random.multinomial(shots, p_vals)
        counts: Dict[str, int] = {}
        for k, count in zip(keys, sampled):
            if count > 0:
                counts[k] = int(count)
        return counts
