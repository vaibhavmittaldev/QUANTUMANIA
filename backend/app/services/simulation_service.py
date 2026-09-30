"""
QUANTUMANIA - Quantum Classical State-Vector Simulator Service
Phase 4: Quantum Simulator
Exact mathematical statevector simulation matching docs/QUANTUM_SCHEMA.md
"""

import math
import random
import time
from typing import List, Dict, Tuple, Optional, Callable
from app.schemas.circuit import CanonicalCircuitSchema
from app.schemas.simulation import (
    SimulationResultSchema,
    StatevectorEntrySchema,
    BlochVectorSchema
)
from app.services.circuit_service import CircuitService

INV_SQRT_2 = 1.0 / math.sqrt(2.0)
EPSILON = 1e-10

GATE_MATRICES_PY: Dict[str, List[List[complex]]] = {
    "X": [
        [complex(0.0, 0.0), complex(1.0, 0.0)],
        [complex(1.0, 0.0), complex(0.0, 0.0)]
    ],
    "Y": [
        [complex(0.0, 0.0), complex(0.0, -1.0)],
        [complex(0.0, 1.0), complex(0.0, 0.0)]
    ],
    "Z": [
        [complex(1.0, 0.0), complex(0.0, 0.0)],
        [complex(0.0, 0.0), complex(-1.0, 0.0)]
    ],
    "H": [
        [complex(INV_SQRT_2, 0.0), complex(INV_SQRT_2, 0.0)],
        [complex(INV_SQRT_2, 0.0), complex(-INV_SQRT_2, 0.0)]
    ],
    "S": [
        [complex(1.0, 0.0), complex(0.0, 0.0)],
        [complex(0.0, 0.0), complex(0.0, 1.0)]
    ],
    "T": [
        [complex(1.0, 0.0), complex(0.0, 0.0)],
        [complex(0.0, 0.0), complex(INV_SQRT_2, INV_SQRT_2)]
    ]
}


class SimulationService:
    @staticmethod
    def index_to_bitstring(index: int, num_qubits: int) -> str:
        """
        Converts basis index to binary string representation.
        Little-Endian: qubit 0 is the rightmost bit, qubit (n-1) is leftmost.
        """
        return "".join(str((index >> q) & 1) for q in reversed(range(num_qubits)))

    @staticmethod
    def create_initial_state(num_qubits: int) -> List[complex]:
        dim = 1 << num_qubits
        state = [complex(0.0, 0.0)] * dim
        state[0] = complex(1.0, 0.0)
        return state

    @staticmethod
    def apply_single_qubit_gate(
        state: List[complex],
        matrix: List[List[complex]],
        target_qubit: int,
        num_qubits: int
    ) -> List[complex]:
        dim = 1 << num_qubits
        next_state = [complex(0.0, 0.0)] * dim
        mask = 1 << target_qubit
        m00, m01 = matrix[0]
        m10, m11 = matrix[1]

        for k in range(dim):
            if (k & mask) == 0:
                i0 = k
                i1 = k | mask
                a0 = state[i0]
                a1 = state[i1]
                next_state[i0] = m00 * a0 + m01 * a1
                next_state[i1] = m10 * a0 + m11 * a1

        return next_state

    @staticmethod
    def apply_cnot(
        state: List[complex],
        control_qubit: int,
        target_qubit: int,
        num_qubits: int
    ) -> List[complex]:
        if control_qubit == target_qubit:
            raise ValueError(f"CNOT control and target qubits cannot be identical (q{control_qubit}).")
        dim = 1 << num_qubits
        next_state = [complex(0.0, 0.0)] * dim
        c_mask = 1 << control_qubit
        t_mask = 1 << target_qubit

        for k in range(dim):
            if (k & c_mask) != 0:
                paired = k ^ t_mask
                next_state[k] = state[paired]
            else:
                next_state[k] = state[k]

        return next_state

    @staticmethod
    def apply_cz(
        state: List[complex],
        control_qubit: int,
        target_qubit: int,
        num_qubits: int
    ) -> List[complex]:
        dim = 1 << num_qubits
        next_state = [complex(0.0, 0.0)] * dim
        c_mask = 1 << control_qubit
        t_mask = 1 << target_qubit

        for k in range(dim):
            if (k & c_mask) != 0 and (k & t_mask) != 0:
                next_state[k] = -state[k]
            else:
                next_state[k] = state[k]

        return next_state

    @staticmethod
    def apply_swap(
        state: List[complex],
        q1: int,
        q2: int,
        num_qubits: int
    ) -> List[complex]:
        dim = 1 << num_qubits
        next_state = [complex(0.0, 0.0)] * dim
        m1 = 1 << q1
        m2 = 1 << q2

        for k in range(dim):
            b1 = 1 if (k & m1) != 0 else 0
            b2 = 1 if (k & m2) != 0 else 0
            if b1 != b2:
                paired = k ^ m1 ^ m2
                next_state[k] = state[paired]
            else:
                next_state[k] = state[k]

        return next_state

    @staticmethod
    def normalize_state(state: List[complex]) -> List[complex]:
        norm_sq = sum(c.real ** 2 + c.imag ** 2 for c in state)
        if norm_sq < EPSILON:
            raise ValueError("Statevector has norm 0 and cannot be normalized.")
        norm = math.sqrt(norm_sq)
        return [c / norm for c in state]

    @staticmethod
    def sample_measurements(
        probabilities: Dict[str, float],
        shots: int,
        rng: Optional[Callable[[], float]] = None
    ) -> Dict[str, int]:
        if shots <= 0 or not probabilities:
            return {}

        rand_func = rng if rng is not None else random.random
        keys = list(probabilities.keys())
        cumulative = []
        c_sum = 0.0
        for k in keys:
            c_sum += probabilities[k]
            cumulative.append(c_sum)

        if c_sum > 0:
            cumulative = [c / c_sum for c in cumulative]

        counts: Dict[str, int] = {k: 0 for k in keys}
        for _ in range(shots):
            r = rand_func()
            # Binary search
            low = 0
            high = len(cumulative) - 1
            chosen = high
            while low <= high:
                mid = (low + high) // 2
                if r <= cumulative[mid]:
                    chosen = mid
                    high = mid - 1
                else:
                    low = mid + 1
            outcome = keys[chosen]
            counts[outcome] += 1

        return counts

    @staticmethod
    def calculate_bloch_vectors(state: List[complex], num_qubits: int) -> List[BlochVectorSchema]:
        dim = 1 << num_qubits
        bloch_list: List[BlochVectorSchema] = []

        for q in range(num_qubits):
            mask = 1 << q
            x_sum = 0.0
            y_sum = 0.0
            z_sum = 0.0

            for k in range(dim):
                if (k & mask) == 0:
                    i0 = k
                    i1 = k | mask
                    a0 = state[i0]
                    a1 = state[i1]

                    # a0* * a1
                    prod = a0.conjugate() * a1
                    x_sum += 2.0 * prod.real
                    y_sum += 2.0 * prod.imag

                    p0 = a0.real ** 2 + a0.imag ** 2
                    p1 = a1.real ** 2 + a1.imag ** 2
                    z_sum += (p0 - p1)

            bloch_list.append(BlochVectorSchema(
                qubit=q,
                x=round(x_sum, 6),
                y=round(y_sum, 6),
                z=round(z_sum, 6)
            ))

        return bloch_list

    @classmethod
    def simulate(
        cls,
        circuit: CanonicalCircuitSchema,
        shots: int = 1024,
        rng: Optional[Callable[[], float]] = None
    ) -> SimulationResultSchema:
        t0 = time.perf_counter()

        # 1. Validation
        validation = CircuitService.validate_circuit(circuit)
        if not validation.is_valid:
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            err_msg = " | ".join(e.message for e in validation.errors)
            return SimulationResultSchema(
                success=False,
                shots=shots,
                counts={},
                probabilities={},
                statevector=[],
                bloch_vectors=[],
                execution_time_ms=round(elapsed_ms, 2),
                error=err_msg
            )

        try:
            # 2. Sort gates by step
            sorted_gates = sorted(
                circuit.gates,
                key=lambda g: (g.step, g.get_effective_targets()[0] if g.get_effective_targets() else 0)
            )

            # 3. Ground state
            state = cls.create_initial_state(circuit.qubits)

            # 4. Gate execution
            for gate in sorted_gates:
                g_type = gate.type.value if hasattr(gate.type, "value") else str(gate.type)

                if g_type == "MEASURE":
                    continue

                if g_type in ("X", "Y", "Z", "H", "S", "T"):
                    targets = gate.get_effective_targets()
                    if not targets:
                        raise ValueError(f"Gate {g_type} missing target qubit.")
                    target = targets[0]
                    matrix = GATE_MATRICES_PY.get(g_type)
                    if not matrix:
                        raise ValueError(f"Unsupported gate: {g_type}")
                    state = cls.apply_single_qubit_gate(state, matrix, target, circuit.qubits)

                elif g_type == "CNOT":
                    controls = gate.get_effective_controls()
                    targets = gate.get_effective_targets()
                    if not controls or not targets:
                        raise ValueError("CNOT gate requires both control and target qubits.")
                    state = cls.apply_cnot(state, controls[0], targets[0], circuit.qubits)

                elif g_type == "CZ":
                    controls = gate.get_effective_controls()
                    targets = gate.get_effective_targets()
                    if not controls or not targets:
                        raise ValueError("CZ gate requires both control and target qubits.")
                    state = cls.apply_cz(state, controls[0], targets[0], circuit.qubits)

                elif g_type == "SWAP":
                    targets = gate.get_effective_targets()
                    if len(targets) < 2:
                        raise ValueError("SWAP gate requires 2 target qubits.")
                    state = cls.apply_swap(state, targets[0], targets[1], circuit.qubits)

                else:
                    raise ValueError(f"Unsupported gate: {g_type}")

            # 5. Normalization
            norm_sq = sum(c.real ** 2 + c.imag ** 2 for c in state)
            if abs(norm_sq - 1.0) > 1e-5:
                state = cls.normalize_state(state)

            # 6. Probabilities & Statevector Entries
            probabilities: Dict[str, float] = {}
            statevector_entries: List[StatevectorEntrySchema] = []
            dim = 1 << circuit.qubits

            for i in range(dim):
                b_str = cls.index_to_bitstring(i, circuit.qubits)
                amp = state[i]
                mag = amp.real ** 2 + amp.imag ** 2
                prob_val = 0.0 if mag < EPSILON else min(1.0, max(0.0, mag))
                probabilities[b_str] = round(prob_val, 6)

                phase_rad = math.atan2(amp.imag, amp.real) if mag > EPSILON else 0.0
                statevector_entries.append(StatevectorEntrySchema(
                    basis=b_str,
                    real=round(amp.real, 6),
                    imag=round(amp.imag, 6),
                    magnitude=round(mag, 6),
                    phase_rad=round(phase_rad, 6)
                ))

            # 7. Bloch vectors
            bloch_vectors = cls.calculate_bloch_vectors(state, circuit.qubits)

            # 8. Measurement sampling
            counts = cls.sample_measurements(probabilities, shots, rng=rng)

            # 9. Explanation
            explanation = cls._generate_explanation(circuit, probabilities)

            elapsed_ms = (time.perf_counter() - t0) * 1000.0

            return SimulationResultSchema(
                success=True,
                shots=shots,
                counts=counts,
                probabilities=probabilities,
                statevector=statevector_entries,
                bloch_vectors=bloch_vectors,
                execution_time_ms=round(elapsed_ms, 2),
                explanation=explanation
            )

        except Exception as ex:
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            return SimulationResultSchema(
                success=False,
                shots=shots,
                counts={},
                probabilities={},
                statevector=[],
                bloch_vectors=[],
                execution_time_ms=round(elapsed_ms, 2),
                error=str(ex)
            )

    @staticmethod
    def _generate_explanation(circuit: CanonicalCircuitSchema, probabilities: Dict[str, float]) -> str:
        gate_types = [g.type.value if hasattr(g.type, "value") else str(g.type) for g in circuit.gates]
        has_h = "H" in gate_types
        has_cnot = "CNOT" in gate_types
        has_x = "X" in gate_types

        non_zero = [k for k, p in probabilities.items() if p > 0.001]

        if has_h and has_cnot and circuit.qubits == 2:
            if len(non_zero) == 2 and probabilities.get("00", 0) > 0.4 and probabilities.get("11", 0) > 0.4:
                return (
                    "Maximally Entangled Bell State |Φ+⟩: "
                    "The circuit creates correlated two-qubit outcomes with equal 50% probability for |00⟩ and |11⟩."
                )

        if circuit.qubits == 1 and gate_types.count("H") == 2:
            if probabilities.get("0", 0) > 0.99:
                return (
                    "Quantum Interference (H² = I): "
                    "Two consecutive Hadamard gates cancel via constructive interference for |0⟩ and destructive interference for |1⟩."
                )

        if has_h and not has_cnot and circuit.qubits == 1:
            return (
                "Equal Quantum Superposition: "
                "The Hadamard gate creates an equal superposition of |0⟩ and |1⟩ with 50% probability each."
            )

        if has_x and not has_h and circuit.qubits == 1:
            if probabilities.get("1", 0) > 0.99:
                return "Pauli-X Bit Flip: The X gate flips the ground state |0⟩ deterministically to |1⟩."

        return "Deterministic Classical Quantum State Evolution Complete."
