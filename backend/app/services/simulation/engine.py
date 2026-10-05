"""
QUANTUMANIA - Multi-Backend Simulation Engine
Orchestrates execution across Qiskit Aer, Cirq, PennyLane, cross-framework comparisons,
OpenQASM 2.0 circuit compilation, and bidirectional Qiskit AST code generation/parsing.
"""

from typing import Dict, Any, List, Optional
import re
import numpy as np

from app.schemas.simulation import (
    CanonicalCircuitSchema,
    SimulationResultSchema
)
from .base import BaseSimulationBackend
from .qiskit_adapter import QiskitAdapter
from .cirq_adapter import CirqAdapter
from .pennylane_adapter import PennyLaneAdapter
from .qbraid_adapter import QBraidAdapter


class SimulationEngine:
    """Central coordinator for quantum simulations, comparisons, and export."""

    def __init__(self):
        self._adapters: Dict[str, BaseSimulationBackend] = {
            "qiskit": QiskitAdapter(),
            "aer": QiskitAdapter(),
            "local": QiskitAdapter(),
            "cirq": CirqAdapter(),
            "pennylane": PennyLaneAdapter(),
            "qbraid": QBraidAdapter(),
        }

    def get_adapter(self, backend_name: str) -> BaseSimulationBackend:
        normalized = backend_name.lower().strip()
        return self._adapters.get(normalized, self._adapters["qiskit"])

    async def execute(
        self,
        circuit: CanonicalCircuitSchema,
        backend: str = "qiskit",
        shots: int = 1024,
        mode: str = "statevector",
        noise_enabled: bool = False,
        step_index: Optional[int] = None
    ) -> SimulationResultSchema:
        adapter = self.get_adapter(backend)
        return await adapter.simulate(
            circuit,
            shots=shots,
            mode=mode,
            noise_enabled=noise_enabled,
            step_index=step_index
        )

    async def compare_backends(
        self,
        circuit: CanonicalCircuitSchema,
        frameworks: Optional[List[str]] = None,
        shots: int = 1024,
        tolerance: float = 0.05
    ) -> Dict[str, Any]:
        """
        Run circuit across multiple backends simultaneously and verify numerical consistency.
        """
        target_frameworks = frameworks or ["Qiskit", "PennyLane", "Cirq"]
        results: Dict[str, Any] = {}
        all_probs: Dict[str, Dict[str, float]] = {}

        for fw in target_frameworks:
            adapter = self.get_adapter(fw)
            res = await adapter.simulate(circuit, shots=shots, mode="statevector", noise_enabled=False)
            results[fw] = res.model_dump() if hasattr(res, "model_dump") else res.dict()
            if res.success:
                all_probs[fw] = res.probabilities or {}

        # Verify numerical consistency across all successful framework results
        consistent = True
        discrepancies: List[str] = []

        framework_names = list(all_probs.keys())
        for i in range(len(framework_names)):
            for j in range(i + 1, len(framework_names)):
                fw1, fw2 = framework_names[i], framework_names[j]
                p1, p2 = all_probs[fw1], all_probs[fw2]
                all_states = set(p1.keys()).union(set(p2.keys()))

                for state in all_states:
                    diff = abs(p1.get(state, 0.0) - p2.get(state, 0.0))
                    if diff > tolerance:
                        consistent = False
                        discrepancies.append(
                            f"State |{state}> discrepancy between {fw1} ({p1.get(state, 0.0):.4f}) "
                            f"and {fw2} ({p2.get(state, 0.0):.4f}) delta={diff:.4f} > tolerance={tolerance}"
                        )

        return {
            "backends_tested": target_frameworks,
            "results": results,
            "consistent": consistent,
            "discrepancies": discrepancies,
            "tolerance_used": tolerance
        }

    def export_openqasm(self, circuit: CanonicalCircuitSchema) -> Dict[str, Any]:
        """Compile canonical circuit to OpenQASM 2.0 text format."""
        try:
            qiskit_adapter: QiskitAdapter = self._adapters["qiskit"]  # type: ignore
            qc = qiskit_adapter._build_qiskit_circuit(circuit)

            try:
                import qiskit.qasm2
                qasm_str = qiskit.qasm2.dumps(qc)
            except (ImportError, AttributeError):
                qasm_str = qc.qasm()

            return {
                "success": True,
                "qasm": qasm_str
            }
        except Exception as ex:
            return {
                "success": False,
                "qasm": "",
                "error": str(e if (e := ex) else "Unknown error")
            }

    def compile_to_qiskit_code(self, circuit: CanonicalCircuitSchema) -> str:
        """Generate human-readable Qiskit Python code from canonical circuit."""
        num_qubits = circuit.qubits
        num_clbits = circuit.classical_bits or num_qubits
        circuit_name = circuit.name or "Quantum Circuit"

        lines = [
            "from qiskit import QuantumCircuit",
            "import numpy as np",
            "",
            f"# QVerse Circuit: {circuit_name}",
            f"qc = QuantumCircuit({num_qubits}, {num_clbits})",
            ""
        ]

        sorted_gates = sorted(circuit.gates, key=lambda g: g.step)
        for gate in sorted_gates:
            gate_type = (gate.type.value if hasattr(gate.type, "value") else str(gate.type)).lower()
            t = gate.target if gate.target is not None else 0
            c = gate.control

            if gate_type in ("h", "x", "y", "z", "s", "t"):
                lines.append(f"qc.{gate_type}({t})")
            elif gate_type in ("rx", "ry", "rz"):
                theta = gate.params.theta if gate.params and gate.params.theta is not None else 1.570796
                lines.append(f"qc.{gate_type}({theta:.4f}, {t})")
            elif gate_type in ("cnot", "cx"):
                ctrl = c if c is not None else (1 if t == 0 else 0)
                lines.append(f"qc.cx({ctrl}, {t})")
            elif gate_type == "cz":
                ctrl = c if c is not None else (1 if t == 0 else 0)
                lines.append(f"qc.cz({ctrl}, {t})")
            elif gate_type == "swap":
                targets = gate.targets or [t, 1 if t == 0 else 0]
                lines.append(f"qc.swap({targets[0]}, {targets[1]})")
            elif gate_type in ("measure", "m"):
                lines.append(f"qc.measure({t}, {t})")

        return "\n".join(lines)

    def parse_qiskit_code(self, code: str) -> Dict[str, Any]:
        """Parse Qiskit Python code into canonical circuit structure."""
        lines = code.split("\n")
        num_qubits = 2
        num_clbits = 2
        gates: List[Dict[str, Any]] = []
        step = 0

        init_match = re.search(r"QuantumCircuit\((\d+)(?:,\s*(\d+))?\)", code)
        if init_match:
            num_qubits = int(init_match.group(1))
            if init_match.group(2):
                num_clbits = int(init_match.group(2))

        for line in lines:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            m = re.match(r"qc\.(h|x|y|z|s|t)\((\d+)\)", line)
            if m:
                gate_name = m.group(1).upper()
                target = int(m.group(2))
                gates.append({
                    "id": f"g-{len(gates)}",
                    "type": gate_name,
                    "target": target,
                    "step": step
                })
                step += 1
                continue

            m = re.match(r"qc\.(rx|ry|rz)\(([^,]+),\s*(\d+)\)", line)
            if m:
                gate_name = m.group(1).upper()
                theta_str = m.group(2).strip().strip("'\"")
                target = int(m.group(3))
                try:
                    theta_val = float(theta_str)
                except ValueError:
                    theta_val = 1.5708
                gates.append({
                    "id": f"g-{len(gates)}",
                    "type": gate_name,
                    "target": target,
                    "params": {"theta": theta_val},
                    "step": step
                })
                step += 1
                continue

            m = re.match(r"qc\.(cx|cz)\((\d+),\s*(\d+)\)", line)
            if m:
                gate_name = "CNOT" if m.group(1) == "cx" else "CZ"
                ctrl = int(m.group(2))
                tgt = int(m.group(3))
                gates.append({
                    "id": f"g-{len(gates)}",
                    "type": gate_name,
                    "control": ctrl,
                    "target": tgt,
                    "step": step
                })
                step += 1
                continue

            m = re.match(r"qc\.swap\((\d+),\s*(\d+)\)", line)
            if m:
                t1 = int(m.group(1))
                t2 = int(m.group(2))
                gates.append({
                    "id": f"g-{len(gates)}",
                    "type": "SWAP",
                    "targets": [t1, t2],
                    "target": t1,
                    "step": step
                })
                step += 1
                continue

            m = re.match(r"qc\.measure\((\d+),\s*(\d+)\)", line)
            if m:
                t = int(m.group(1))
                gates.append({
                    "id": f"g-{len(gates)}",
                    "type": "MEASURE",
                    "target": t,
                    "step": step
                })
                step += 1
                continue

        max_q = max((g.get("target", 0) for g in gates), default=0)
        final_qubits = max(num_qubits, max_q + 1)

        return {
            "schema_version": "1.0.0",
            "name": "Synchronized Circuit",
            "qubits": final_qubits,
            "classical_bits": num_clbits,
            "gates": gates
        }


simulation_engine = SimulationEngine()
