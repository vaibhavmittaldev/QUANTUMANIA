"""
QUANTUMANIA - Google Cirq Simulation Adapter
Compiles canonical circuits to Cirq circuits and simulates exact statevectors.
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
    import cirq
    HAS_CIRQ = True
except ImportError:
    HAS_CIRQ = False


class CirqAdapter(BaseSimulationBackend):
    """Executes canonical circuits on Google Cirq engine."""

    @property
    def name(self) -> str:
        return "cirq"

    @property
    def framework(self) -> str:
        version = getattr(cirq, "__version__", "unknown") if HAS_CIRQ else "none"
        return f"Cirq ({version})"

    async def simulate(
        self,
        circuit: CanonicalCircuitSchema,
        shots: int = 1024,
        mode: str = "statevector",
        noise_enabled: bool = False,
        step_index: Optional[int] = None
    ) -> SimulationResultSchema:
        if not HAS_CIRQ:
            return SimulationResultSchema(
                success=False,
                error="Cirq is not installed in the backend environment.",
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
        qubits = cirq.LineQubit.range(num_qubits)
        cirq_circuit = cirq.Circuit()

        sorted_gates = sorted(circuit.gates, key=lambda g: g.step)
        if step_index is not None:
            sorted_gates = [g for g in sorted_gates if g.step <= step_index]

        for gate in sorted_gates:
            gate_type = gate.type.value if hasattr(gate.type, "value") else str(gate.type).upper()
            t = gate.target if gate.target is not None else 0
            c = gate.control

            if t >= num_qubits:
                continue

            if gate_type == "H":
                cirq_circuit.append(cirq.H(qubits[t]))
            elif gate_type == "X":
                cirq_circuit.append(cirq.X(qubits[t]))
            elif gate_type == "Y":
                cirq_circuit.append(cirq.Y(qubits[t]))
            elif gate_type == "Z":
                cirq_circuit.append(cirq.Z(qubits[t]))
            elif gate_type == "S":
                cirq_circuit.append(cirq.S(qubits[t]))
            elif gate_type == "T":
                cirq_circuit.append(cirq.T(qubits[t]))
            elif gate_type in ("CNOT", "CX"):
                ctrl = c if c is not None and c < num_qubits else (1 if t == 0 else 0)
                cirq_circuit.append(cirq.CNOT(qubits[ctrl], qubits[t]))
            elif gate_type == "CZ":
                ctrl = c if c is not None and c < num_qubits else (1 if t == 0 else 0)
                cirq_circuit.append(cirq.CZ(qubits[ctrl], qubits[t]))
            elif gate_type == "SWAP":
                targets = gate.targets or [t, 1 if t == 0 else 0]
                t1, t2 = targets[0], targets[1]
                if t1 < num_qubits and t2 < num_qubits:
                    cirq_circuit.append(cirq.SWAP(qubits[t1], qubits[t2]))
            elif gate_type == "RX":
                theta = self.parse_angle(gate.params.theta if gate.params else 0.0)
                cirq_circuit.append(cirq.rx(theta)(qubits[t]))
            elif gate_type == "RY":
                theta = self.parse_angle(gate.params.theta if gate.params else 0.0)
                cirq_circuit.append(cirq.ry(theta)(qubits[t]))
            elif gate_type == "RZ":
                theta = self.parse_angle(gate.params.theta if gate.params else 0.0)
                cirq_circuit.append(cirq.rz(theta)(qubits[t]))

        simulator = cirq.Simulator()
        sim_res = simulator.simulate(cirq_circuit, qubit_order=qubits)
        sv = np.array(sim_res.final_state_vector, dtype=complex)

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
            depth=len(cirq_circuit),
            operationCount=sum(1 for _ in cirq_circuit.all_operations()),
            shots=shots,
            counts=counts,
            probabilities=probabilities,
            statevector=entries,
            bloch_vectors=bloch_vectors,
            execution_time_ms=execution_time_ms,
            backend=BackendInfoSchema(
                id="cirq-simulator",
                framework="Google Cirq",
                mode=mode,
                version=getattr(cirq, "__version__", "1.0")
            ),
            current_step=step_index
        )
