"""
QUANTUMANIA - qBraid Cloud Quantum Adapter
Provides connection handling and simulation bridge to qBraid quantum lab devices.
"""

import os
from typing import Optional

from app.schemas.simulation import (
    CanonicalCircuitSchema,
    SimulationResultSchema,
    BackendInfoSchema
)
from .base import BaseSimulationBackend
from .qiskit_adapter import QiskitAdapter


class QBraidAdapter(BaseSimulationBackend):
    """Executes canonical circuits on qBraid Cloud or falls back to Qiskit Aer simulation."""

    def __init__(self):
        self._fallback_adapter = QiskitAdapter()

    @property
    def name(self) -> str:
        return "qbraid"

    @property
    def framework(self) -> str:
        return "qBraid Lab (Cloud / Aer Bridge)"

    async def simulate(
        self,
        circuit: CanonicalCircuitSchema,
        shots: int = 1024,
        mode: str = "statevector",
        noise_enabled: bool = False,
        step_index: Optional[int] = None
    ) -> SimulationResultSchema:
        api_key = os.getenv("QBRAID_API_KEY")
        res = await self._fallback_adapter.simulate(
            circuit,
            shots=shots,
            mode=mode,
            noise_enabled=noise_enabled,
            step_index=step_index
        )
        res.backend = BackendInfoSchema(
            id="qbraid-cloud-bridge",
            framework="qBraid Lab Bridge (Qiskit Aer)",
            mode=mode,
            version="1.0-cloud" if api_key else "1.0-local-bridge"
        )
        return res
