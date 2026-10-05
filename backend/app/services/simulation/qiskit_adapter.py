"""
QUANTUMANIA - Qiskit Aer Simulation Adapter
Compiles canonical circuits to Qiskit QuantumCircuit and runs on AerSimulator.
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
    import qiskit
    from qiskit import QuantumCircuit
    from qiskit.quantum_info import Statevector
    HAS_QISKIT = True
except ImportError:
    HAS_QISKIT = False

try:
    from qiskit_aer import AerSimulator
    from qiskit_aer.noise import NoiseModel, depolarizing_error
    HAS_AER = True
except ImportError:
    HAS_AER = False


class QiskitAdapter(BaseSimulationBackend):
    """Executes canonical circuits on IBM Qiskit and Qiskit Aer."""

    @property
    def name(self) -> str:
        return "qiskit"

    @property
    def framework(self) -> str:
        version = getattr(qiskit, "__version__", "unknown") if HAS_QISKIT else "none"
        return f"Qiskit Aer ({version})"

    def _build_qiskit_circuit(
        self,
        circuit: CanonicalCircuitSchema,
        step_index: Optional[int] = None
    ) -> "QuantumCircuit":
        """Build Qiskit QuantumCircuit from canonical schema."""
        num_qubits = circuit.qubits
        num_clbits = circuit.classical_bits or num_qubits
        qc = QuantumCircuit(num_qubits, num_clbits)

        # Sort gates chronologically by step
        sorted_gates = sorted(circuit.gates, key=lambda g: g.step)
        if step_index is not None:
            sorted_gates = [g for g in sorted_gates if g.step <= step_index]

        for gate in sorted_gates:
            gate_type = gate.type.value if hasattr(gate.type, "value") else str(gate.type).upper()
            target = gate.target if gate.target is not None else 0
            control = gate.control

            if gate_type == "H":
                qc.h(target)
            elif gate_type == "X":
                qc.x(target)
            elif gate_type == "Y":
                qc.y(target)
            elif gate_type == "Z":
                qc.z(target)
            elif gate_type == "S":
                qc.s(target)
            elif gate_type == "T":
                qc.t(target)
            elif gate_type in ("CNOT", "CX"):
                ctrl = control if control is not None else (1 if target == 0 else 0)
                qc.cx(ctrl, target)
            elif gate_type == "CZ":
                ctrl = control if control is not None else (1 if target == 0 else 0)
                qc.cz(ctrl, target)
            elif gate_type == "SWAP":
                targets = gate.targets or [target, 1 if target == 0 else 0]
                qc.swap(targets[0], targets[1])
            elif gate_type == "RX":
                theta = self.parse_angle(gate.params.theta if gate.params else 0.0)
                qc.rx(theta, target)
            elif gate_type == "RY":
                theta = self.parse_angle(gate.params.theta if gate.params else 0.0)
                qc.ry(theta, target)
            elif gate_type == "RZ":
                theta = self.parse_angle(gate.params.theta if gate.params else 0.0)
                qc.rz(theta, target)
            elif gate_type in ("MEASURE", "M"):
                qc.measure(target, target)

        return qc

    async def simulate(
        self,
        circuit: CanonicalCircuitSchema,
        shots: int = 1024,
        mode: str = "statevector",
        noise_enabled: bool = False,
        step_index: Optional[int] = None
    ) -> SimulationResultSchema:
        if not HAS_QISKIT:
            return SimulationResultSchema(
                success=False,
                error="Qiskit is not installed in the backend environment.",
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
        qc = self._build_qiskit_circuit(circuit, step_index=step_index)
        num_qubits = circuit.qubits

        # Drop terminal measurements for pure statevector computation
        try:
            qc_no_measure = qc.remove_final_measurements(inplace=False)
            raw_sv = Statevector.from_instruction(qc_no_measure).data
        except Exception:
            raw_sv = Statevector.from_instruction(qc).data

        # Permute statevector from Qiskit's little-endian to QVerse's big-endian
        dim = 1 << num_qubits
        permuted_sv = np.zeros(dim, dtype=complex)
        for i in range(dim):
            binary = format(i, f"0{num_qubits}b")
            rev_binary = binary[::-1]
            qiskit_idx = int(rev_binary, 2)
            permuted_sv[i] = raw_sv[qiskit_idx]

        # Probabilities
        probabilities: Dict[str, float] = {}
        for i in range(dim):
            basis_str = format(i, f"0{num_qubits}b")
            p = float(abs(permuted_sv[i]) ** 2)
            if p > 1e-8:
                probabilities[basis_str] = round(p, 6)

        # Counts (Exact or Noisy AerSimulator)
        counts: Dict[str, int] = {}
        if noise_enabled and HAS_AER:
            try:
                noise_model = NoiseModel()
                err_1q = depolarizing_error(0.02, 1)
                err_2q = depolarizing_error(0.04, 2)
                noise_model.add_all_qubit_quantum_error(err_1q, ["h", "x", "y", "z", "s", "t", "rx", "ry", "rz"])
                noise_model.add_all_qubit_quantum_error(err_2q, ["cx", "cz", "swap"])

                qc_noisy = qc.copy()
                qc_noisy.measure_all()
                sim = AerSimulator(noise_model=noise_model)
                job = sim.run(qc_noisy, shots=shots)
                raw_counts = job.result().get_counts()

                for bitstr, cnt in raw_counts.items():
                    clean_str = bitstr.replace(" ", "")
                    norm_str = clean_str[::-1][:num_qubits]
                    counts[norm_str] = counts.get(norm_str, 0) + cnt
            except Exception:
                counts = self.sample_counts_from_probabilities(probabilities, shots)
        else:
            counts = self.sample_counts_from_probabilities(probabilities, shots)

        entries = self.statevector_to_entries(permuted_sv, num_qubits)
        bloch_vectors = self.calculate_bloch_vectors(permuted_sv, num_qubits)
        execution_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        return SimulationResultSchema(
            success=True,
            qubits=num_qubits,
            depth=qc.depth(),
            operationCount=len(qc.data),
            shots=shots,
            counts=counts,
            probabilities=probabilities,
            statevector=entries,
            bloch_vectors=bloch_vectors,
            execution_time_ms=execution_time_ms,
            backend=BackendInfoSchema(
                id="qiskit-aer",
                framework="Qiskit Aer",
                mode=mode,
                version=getattr(qiskit, "__version__", "2.0")
            ),
            current_step=step_index,
            noise={"enabled": noise_enabled, "model": "depolarizing", "errorRate": 0.02} if noise_enabled else None
        )
