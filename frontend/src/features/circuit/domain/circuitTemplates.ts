/**
 * QUANTUMANIA - Educational Starter Circuit Templates
 * Phase 3: Quantum Circuit Builder
 */

import { CircuitTemplate } from '../../../types/circuit';

export const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
  {
    id: 'empty-2q',
    name: 'Empty 2-Qubit Canvas',
    description: 'Clean workspace initialized with 2 unentangled ground state qubits |00⟩.',
    qubits: 2,
    gate_count: 0,
    circuit: {
      schema_version: '1.0.0',
      name: 'Empty 2-Qubit Canvas',
      description: 'Clean workspace initialized with 2 unentangled ground state qubits |00⟩.',
      qubits: 2,
      classical_bits: 2,
      gates: [],
      measurements: []
    }
  },
  {
    id: 'superposition',
    name: 'Single Qubit Superposition',
    description: 'Applies a Hadamard gate to |0⟩ creating equal superposition (|0⟩ + |1⟩)/√2 followed by measurement.',
    qubits: 1,
    gate_count: 2,
    circuit: {
      schema_version: '1.0.0',
      name: 'Single Qubit Superposition',
      description: 'Applies a Hadamard gate to |0⟩ creating equal superposition (|0⟩ + |1⟩)/√2 followed by measurement.',
      qubits: 1,
      classical_bits: 1,
      gates: [
        { id: 'tpl_h0', type: 'H', target: 0, step: 0 },
        { id: 'tpl_m0', type: 'MEASURE', target: 0, step: 1 }
      ],
      measurements: [{ qubit: 0, classical_bit: 0 }]
    }
  },
  {
    id: 'bell-state',
    name: 'Bell State |Φ+⟩ (EPR Pair)',
    description: 'Prepares the canonical maximally entangled 2-qubit state: (|00⟩ + |11⟩)/√2 using H and CNOT.',
    qubits: 2,
    gate_count: 4,
    circuit: {
      schema_version: '1.0.0',
      name: 'Bell State |Φ+⟩ Preparation',
      description: 'Prepares the canonical maximally entangled 2-qubit state: (|00⟩ + |11⟩)/√2 using H and CNOT.',
      qubits: 2,
      classical_bits: 2,
      gates: [
        { id: 'tpl_bell_h', type: 'H', target: 0, step: 0 },
        { id: 'tpl_bell_cnot', type: 'CNOT', control: 0, target: 1, step: 1 },
        { id: 'tpl_bell_m0', type: 'MEASURE', target: 0, step: 2 },
        { id: 'tpl_bell_m1', type: 'MEASURE', target: 1, step: 2 }
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 }
      ]
    }
  },
  {
    id: 'ghz-state',
    name: '3-Qubit GHZ State',
    description: 'Prepares the tri-partite Greenberger-Horne-Zeilinger entangled state (|000⟩ + |111⟩)/√2.',
    qubits: 3,
    gate_count: 6,
    circuit: {
      schema_version: '1.0.0',
      name: '3-Qubit GHZ State',
      description: 'Prepares the tri-partite Greenberger-Horne-Zeilinger entangled state (|000⟩ + |111⟩)/√2.',
      qubits: 3,
      classical_bits: 3,
      gates: [
        { id: 'tpl_ghz_h0', type: 'H', target: 0, step: 0 },
        { id: 'tpl_ghz_cx01', type: 'CNOT', control: 0, target: 1, step: 1 },
        { id: 'tpl_ghz_cx12', type: 'CNOT', control: 1, target: 2, step: 2 },
        { id: 'tpl_ghz_m0', type: 'MEASURE', target: 0, step: 3 },
        { id: 'tpl_ghz_m1', type: 'MEASURE', target: 1, step: 3 },
        { id: 'tpl_ghz_m2', type: 'MEASURE', target: 2, step: 3 }
      ],
      measurements: [
        { qubit: 0, classical_bit: 0 },
        { qubit: 1, classical_bit: 1 },
        { qubit: 2, classical_bit: 2 }
      ]
    }
  }
];

export function getTemplateById(templateId: string): CircuitTemplate | undefined {
  return CIRCUIT_TEMPLATES.find((t) => t.id === templateId);
}
