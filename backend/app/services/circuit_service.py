"""
QUANTUMANIA - Circuit Validation & Templates Service
Phase 3: Quantum Circuit Builder
Enforces validation rules from docs/QUANTUM_SCHEMA.md
"""

from typing import List, Dict, Optional, Tuple
from app.schemas.circuit import (
    CanonicalCircuitSchema,
    CircuitValidationResponse,
    CircuitValidationErrorDetail,
    CircuitTemplateSummary,
    GateType,
    QuantumGateSchema,
    MeasurementMappingSchema
)


class CircuitService:
    MAX_QUBITS = 8
    MAX_DEPTH = 100
    MAX_GATES = 500

    @classmethod
    def validate_circuit(cls, circuit: CanonicalCircuitSchema) -> CircuitValidationResponse:
        errors: List[CircuitValidationErrorDetail] = []
        warnings: List[str] = []

        # 1. Basic schema and limits
        if circuit.qubits < 1:
            errors.append(CircuitValidationErrorDetail(
                message="Circuit must allocate at least 1 qubit.",
                violation="MIN_QUBITS_VIOLATION"
            ))
        elif circuit.qubits > cls.MAX_QUBITS:
            errors.append(CircuitValidationErrorDetail(
                message=f"Circuit exceeds maximum supported qubits for MVP ({cls.MAX_QUBITS}).",
                violation="MAX_QUBITS_EXCEEDED"
            ))

        if circuit.classical_bits < 0 or circuit.classical_bits > 10:
            errors.append(CircuitValidationErrorDetail(
                message="Classical bits must be between 0 and 10.",
                violation="CLASSICAL_BITS_OUT_OF_BOUNDS"
            ))

        if len(circuit.gates) > cls.MAX_GATES:
            errors.append(CircuitValidationErrorDetail(
                message=f"Circuit exceeds maximum operations limit ({cls.MAX_GATES}).",
                violation="MAX_OPERATIONS_EXCEEDED"
            ))

        # 2. Per-gate validation and collision checking
        # Map of (step, qubit) -> gate_id
        occupied_qubit_steps: Dict[Tuple[int, int], str] = {}
        max_step = -1

        for idx, gate in enumerate(circuit.gates):
            g_type = gate.type
            step = gate.step
            if step > max_step:
                max_step = step

            if step >= cls.MAX_DEPTH:
                errors.append(CircuitValidationErrorDetail(
                    gate_id=gate.id,
                    gate_index=idx,
                    gate_type=g_type.value,
                    message=f"Gate step ({step}) exceeds maximum depth limit ({cls.MAX_DEPTH}).",
                    violation="MAX_DEPTH_EXCEEDED"
                ))

            targets = gate.get_effective_targets()
            controls = gate.get_effective_controls()

            # Bounds checking for targets
            for t in targets:
                if t < 0 or t >= circuit.qubits:
                    errors.append(CircuitValidationErrorDetail(
                        gate_id=gate.id,
                        gate_index=idx,
                        gate_type=g_type.value,
                        message=f"Target qubit index {t} is out of bounds (circuit has {circuit.qubits} qubits).",
                        violation="QUBIT_OUT_OF_BOUNDS"
                    ))

            # Bounds checking for controls
            for c in controls:
                if c < 0 or c >= circuit.qubits:
                    errors.append(CircuitValidationErrorDetail(
                        gate_id=gate.id,
                        gate_index=idx,
                        gate_type=g_type.value,
                        message=f"Control qubit index {c} is out of bounds (circuit has {circuit.qubits} qubits).",
                        violation="QUBIT_OUT_OF_BOUNDS"
                    ))

            # Gate specific logic
            if g_type == GateType.CNOT:
                if len(controls) == 0:
                    errors.append(CircuitValidationErrorDetail(
                        gate_id=gate.id,
                        gate_index=idx,
                        gate_type=g_type.value,
                        message="CNOT gate requires a control qubit.",
                        violation="MISSING_CONTROL"
                    ))
                if len(targets) == 0:
                    errors.append(CircuitValidationErrorDetail(
                        gate_id=gate.id,
                        gate_index=idx,
                        gate_type=g_type.value,
                        message="CNOT gate requires a target qubit.",
                        violation="MISSING_TARGET"
                    ))
                if len(controls) > 0 and len(targets) > 0:
                    ctrl = controls[0]
                    tgt = targets[0]
                    if ctrl == tgt:
                        errors.append(CircuitValidationErrorDetail(
                            gate_id=gate.id,
                            gate_index=idx,
                            gate_type=g_type.value,
                            message=f"CNOT requires two different qubits: control ({ctrl}) and target ({tgt}) cannot be identical.",
                            violation="CONTROL_EQUALS_TARGET"
                        ))
            elif g_type in [GateType.X, GateType.Y, GateType.Z, GateType.H, GateType.S, GateType.T]:
                if len(targets) == 0:
                    errors.append(CircuitValidationErrorDetail(
                        gate_id=gate.id,
                        gate_index=idx,
                        gate_type=g_type.value,
                        message=f"{g_type.value} gate requires a target qubit.",
                        violation="MISSING_TARGET"
                    ))
                elif len(targets) > 1:
                    errors.append(CircuitValidationErrorDetail(
                        gate_id=gate.id,
                        gate_index=idx,
                        gate_type=g_type.value,
                        message=f"Single-qubit {g_type.value} gate cannot act on multiple targets simultaneously.",
                        violation="EXCESS_TARGETS"
                    ))
            elif g_type == GateType.MEASURE:
                if len(targets) == 0:
                    errors.append(CircuitValidationErrorDetail(
                        gate_id=gate.id,
                        gate_index=idx,
                        gate_type=g_type.value,
                        message="Measurement operation requires a target qubit.",
                        violation="MISSING_TARGET"
                    ))

            # Collision detection across active qubits at this time step
            active_qubits = set(targets + controls)
            for q in active_qubits:
                if 0 <= q < circuit.qubits:
                    key = (step, q)
                    if key in occupied_qubit_steps:
                        errors.append(CircuitValidationErrorDetail(
                            gate_id=gate.id,
                            gate_index=idx,
                            gate_type=g_type.value,
                            message=f"Qubit collision at step {step} on qubit q{q}: multiple gates acting simultaneously.",
                            violation="QUBIT_COLLISION"
                        ))
                    else:
                        occupied_qubit_steps[key] = gate.id or f"gate_{idx}"

        # 3. Measurements list validation if present
        if circuit.measurements:
            for m in circuit.measurements:
                if m.qubit >= circuit.qubits:
                    errors.append(CircuitValidationErrorDetail(
                        message=f"Measurement mapping references qubit {m.qubit} which exceeds allocated qubits ({circuit.qubits}).",
                        violation="QUBIT_OUT_OF_BOUNDS"
                    ))
                if m.classical_bit >= circuit.classical_bits:
                    errors.append(CircuitValidationErrorDetail(
                        message=f"Measurement mapping references classical bit c{m.classical_bit} which exceeds allocated classical bits ({circuit.classical_bits}).",
                        violation="CLASSICAL_BIT_OUT_OF_BOUNDS"
                    ))

        calculated_depth = (max_step + 1) if max_step >= 0 else 0

        # Educational warnings
        if len(circuit.gates) > 0 and not any(g.type == GateType.MEASURE for g in circuit.gates) and not circuit.measurements:
            warnings.append("Circuit contains quantum gates but no measurement operations. In Phase 4, measurement is required to sample classical bit counts.")

        return CircuitValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            depth=calculated_depth,
            gate_count=len(circuit.gates),
            qubits=circuit.qubits,
            classical_bits=circuit.classical_bits
        )

    @classmethod
    def get_templates(cls) -> List[CircuitTemplateSummary]:
        templates = [
            CircuitTemplateSummary(
                id="empty-2q",
                name="Empty 2-Qubit Canvas",
                description="Clean starting workspace with two unentangled ground state qubits |00⟩.",
                qubits=2,
                gate_count=0,
                circuit=CanonicalCircuitSchema(
                    schema_version="1.0.0",
                    name="Empty 2-Qubit Canvas",
                    description="Clean starting workspace with two unentangled ground state qubits |00⟩.",
                    qubits=2,
                    classical_bits=2,
                    gates=[],
                    measurements=[]
                )
            ),
            CircuitTemplateSummary(
                id="superposition",
                name="Single Qubit Superposition",
                description="Applies a Hadamard gate to |0⟩ creating equal superposition (|0⟩ + |1⟩)/√2 followed by measurement.",
                qubits=1,
                gate_count=2,
                circuit=CanonicalCircuitSchema(
                    schema_version="1.0.0",
                    name="Single Qubit Superposition",
                    description="Applies a Hadamard gate to |0⟩ creating equal superposition (|0⟩ + |1⟩)/√2 followed by measurement.",
                    qubits=1,
                    classical_bits=1,
                    gates=[
                        QuantumGateSchema(id="sup-h-1", type=GateType.H, target=0, step=0),
                        QuantumGateSchema(id="sup-m-1", type=GateType.MEASURE, target=0, step=1)
                    ],
                    measurements=[
                        MeasurementMappingSchema(qubit=0, classical_bit=0)
                    ]
                )
            ),
            CircuitTemplateSummary(
                id="bell-state",
                name="Bell State |Φ+⟩ Preparation",
                description="Creates maximally entangled EPR pair (|00⟩ + |11⟩)/√2 using Hadamard and CNOT gates.",
                qubits=2,
                gate_count=4,
                circuit=CanonicalCircuitSchema(
                    schema_version="1.0.0",
                    name="Bell State |Φ+⟩ Preparation",
                    description="Creates maximally entangled EPR pair (|00⟩ + |11⟩)/√2 using Hadamard and CNOT gates.",
                    qubits=2,
                    classical_bits=2,
                    gates=[
                        QuantumGateSchema(id="bell-h-1", type=GateType.H, target=0, step=0),
                        QuantumGateSchema(id="bell-cnot-1", type=GateType.CNOT, control=0, target=1, step=1),
                        QuantumGateSchema(id="bell-m-0", type=GateType.MEASURE, target=0, step=2),
                        QuantumGateSchema(id="bell-m-1", type=GateType.MEASURE, target=1, step=2)
                    ],
                    measurements=[
                        MeasurementMappingSchema(qubit=0, classical_bit=0),
                        MeasurementMappingSchema(qubit=1, classical_bit=1)
                    ]
                )
            ),
            CircuitTemplateSummary(
                id="ghz-state",
                name="3-Qubit GHZ Entanglement",
                description="Prepares the Greenberger-Horne-Zeilinger tri-partite entangled state (|000⟩ + |111⟩)/√2.",
                qubits=3,
                gate_count=5,
                circuit=CanonicalCircuitSchema(
                    schema_version="1.0.0",
                    name="3-Qubit GHZ Entanglement",
                    description="Prepares the Greenberger-Horne-Zeilinger tri-partite entangled state (|000⟩ + |111⟩)/√2.",
                    qubits=3,
                    classical_bits=3,
                    gates=[
                        QuantumGateSchema(id="ghz-h-0", type=GateType.H, target=0, step=0),
                        QuantumGateSchema(id="ghz-cx-01", type=GateType.CNOT, control=0, target=1, step=1),
                        QuantumGateSchema(id="ghz-cx-12", type=GateType.CNOT, control=1, target=2, step=2),
                        QuantumGateSchema(id="ghz-m-0", type=GateType.MEASURE, target=0, step=3),
                        QuantumGateSchema(id="ghz-m-1", type=GateType.MEASURE, target=1, step=3),
                        QuantumGateSchema(id="ghz-m-2", type=GateType.MEASURE, target=2, step=3)
                    ],
                    measurements=[
                        MeasurementMappingSchema(qubit=0, classical_bit=0),
                        MeasurementMappingSchema(qubit=1, classical_bit=1),
                        MeasurementMappingSchema(qubit=2, classical_bit=2)
                    ]
                )
            )
        ]
        return templates

    @classmethod
    def get_template_by_id(cls, template_id: str) -> Optional[CircuitTemplateSummary]:
        for t in cls.get_templates():
            if t.id == template_id:
                return t
        return None
