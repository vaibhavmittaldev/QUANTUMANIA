"""
QUANTUMANIA - Xanadu PennyLane Simulation Adapter
Compiles canonical circuits to PennyLane QNodes on default.qubit device.
"""

import time
import numpy as np
from typing import Optional, Dict

from app.schemas.simulation import (
    CanonicalCircuitSchema,
    SimulationResultSchema,
    BackendInfoSchema
)
from .base import BaseSimulationBackend

try:
    import pennylane as qml
    HAS_PENNYLANE = True
except ImportError:
    HAS_PENNYLANE = False


class PennyLaneAdapter(BaseSimulationBackend):
    """Executes canonical circuits on Xanadu PennyLane."""

    @property
    def name(self) -> str:
        return "pennylane"

    @property
    def framework(self) -> str:
        version = getattr(qml, "__version__", "unknown") if HAS_PENNYLANE else "none"
        return f"PennyLane ({version})"

    async def simulate(
        self,
        circuit: CanonicalCircuitSchema,
        shots: int = 1024,
        mode: str = "statevector",
        noise_enabled: bool = False,
        step_index: Optional[int] = None
    ) -> SimulationResultSchema:
        if not HAS_PENNYLANE:
            return SimulationResultSchema(
                success=False,
                error="PennyLane is not installed in the backend environment.",
                qubits=circuit.qubits,
                depth=0,
                operationCount=0,
                shots=shots,
                counts={},
                probabilities={},
                statevector=[],
                bloch_vectors=[],
                execution_time_ms=0.0
            )

        start_time = time.perf_counter()
        num_qubits = circuit.qubits
        dev = qml.device("default.qubit", wires=num_qubits)

        sorted_gates = sorted(circuit.gates, key=lambda g: g.step)
        if step_index is not None:
            sorted_gates = [g for g in sorted_gates if g.step <= step_index]

        @qml.qnode(dev)
        def quantum_circuit():
            for gate in sorted_gates:
                gate_type = gate.type.value if hasattr(gate.type, "value") else str(gate.type).upper()
                t = gate.target if gate.target is not None else 0
                c = gate.control

                if t >= num_qubits:
                    continue

                if gate_type == "H":
                    qml.Hadamard(wires=t)
                elif gate_type == "X":
                    qml.PauliX(wires=t)
                elif gate_type == "Y":
                    qml.PauliY(wires=t)
                elif gate_type == "Z":
                    qml.PauliZ(wires=t)
                elif gate_type == "S":
                    qml.S(wires=t)
                elif gate_type == "T":
                    qml.T(wires=t)
                elif gate_type in ("CNOT", "CX"):
                    ctrl = c if c is not None and c < num_qubits else (1 if t == 0 else 0)
                    qml.CNOT(wires=[ctrl, t])
                elif gate_type == "CZ":
                    ctrl = c if c is not None and c < num_qubits else (1 if t == 0 else 0)
                    qml.CZ(wires=[ctrl, t])
                elif gate_type == "SWAP":
                    targets = gate.targets or [t, 1 if t == 0 else 0]
                    t1, t2 = targets[0], targets[1]
                    if t1 < num_qubits and t2 < num_qubits:
                        qml.SWAP(wires=[t1, t2])
                elif gate_type == "RX":
                    theta = self.parse_angle(gate.params.theta if gate.params else 0.0)
                    qml.RX(theta, wires=t)
                elif gate_type == "RY":
                    theta = self.parse_angle(gate.params.theta if gate.params else 0.0)
                    qml.RY(theta, wires=t)
                elif gate_type == "RZ":
                    theta = self.parse_angle(gate.params.theta if gate.params else 0.0)
                    qml.RZ(theta, wires=t)

            return qml.state()

        raw_sv = quantum_circuit()
        sv = np.array(raw_sv, dtype=complex)

        dim = 1 << num_qubits
        probabilities: Dict[str, float] = {}
        for i in range(dim):
            basis_str = format(i, f"0{num_qubits}b")
            p = float(abs(sv[i]) ** 2)
            if p > 1e-8:
                probabilities[basis_str] = round(p, 6)

        counts = self.sample_counts_from_probabilities(probabilities, shots)
        entries = self.statevector_to_entries(sv, num_qubits)
        bloch_vectors = self.calculate_bloch_vectors(sv, num_qubits)
        execution_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return SimulationResultSchema(
            success=True,
            qubits=num_qubits,
            depth=len(sorted_gates),
            operationCount=len(sorted_gates),
            shots=shots,
            counts=counts,
            probabilities=probabilities,
            statevector=entries,
            bloch_vectors=bloch_vectors,
            execution_time_ms=execution_time_ms,
            backend=BackendInfoSchema(
                id="pennylane-default-qubit",
                framework="PennyLane",
                mode=mode,
                version=getattr(qml, "__version__", "0.38")
            ),
            current_step=step_index
        )
