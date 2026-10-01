/**
 * QUANTUMANIA - Quantum DSL Types and Diagnostics
 * Feature: Drag & Drop Circuit Designer + Bidirectional Monaco Code Editor
 */

import { CanonicalCircuit, GateType } from '../../../types/circuit';

export interface DslDiagnostic {
  line: number;
  startColumn: number;
  endColumn: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export interface CodeSourceMap {
  lineToGateId: Map<number, string>;
  gateIdToLine: Map<string, number>;
}

export interface DslParseResult {
  success: boolean;
  circuit?: CanonicalCircuit;
  diagnostics: DslDiagnostic[];
  // Mapping between source line numbers (1-indexed) and canonical gate IDs
  lineToGateId: Map<number, string>;
  gateIdToLine: Map<string, number>;
}

export interface DslCompletionItem {
  label: string;
  kind: string;
  detail: string;
  documentation: string;
  insertText: string;
}

export interface QuantumOpSpec {
  method: string;
  aliases?: string[];
  type: GateType;
  numQubits: number;
  hasParams?: boolean;
  description: string;
  signature: string;
  example: string;
}

export const QUANTUM_DSL_OPS: Record<string, QuantumOpSpec> = {
  h: {
    method: 'h',
    type: 'H',
    numQubits: 1,
    description: 'Hadamard gate. Creates equal superposition: H|0⟩ = (|0⟩ + |1⟩)/√2.',
    signature: 'qc.h(qubit: int)',
    example: 'qc.h(0)'
  },
  x: {
    method: 'x',
    type: 'X',
    numQubits: 1,
    description: 'Pauli-X (NOT) gate. Flips |0⟩ to |1⟩ and vice versa.',
    signature: 'qc.x(qubit: int)',
    example: 'qc.x(0)'
  },
  y: {
    method: 'y',
    type: 'Y',
    numQubits: 1,
    description: 'Pauli-Y gate. Applies bit-flip and phase-flip: Y|0⟩ = i|1⟩, Y|1⟩ = -i|0⟩.',
    signature: 'qc.y(qubit: int)',
    example: 'qc.y(0)'
  },
  z: {
    method: 'z',
    type: 'Z',
    numQubits: 1,
    description: 'Pauli-Z gate. Phase-flip gate: leaves |0⟩ unchanged and maps |1⟩ to -|1⟩.',
    signature: 'qc.z(qubit: int)',
    example: 'qc.z(0)'
  },
  s: {
    method: 's',
    type: 'S',
    numQubits: 1,
    description: 'Phase (S) gate. Applies a π/2 rotation around the Z-axis (√Z).',
    signature: 'qc.s(qubit: int)',
    example: 'qc.s(0)'
  },
  t: {
    method: 't',
    type: 'T',
    numQubits: 1,
    description: 'T gate. Applies a π/4 rotation around the Z-axis (fourth root of Z).',
    signature: 'qc.t(qubit: int)',
    example: 'qc.t(0)'
  },
  cx: {
    method: 'cx',
    aliases: ['cnot'],
    type: 'CNOT',
    numQubits: 2,
    description: 'Controlled-NOT (CX) gate. Flips target qubit if control qubit is |1⟩.',
    signature: 'qc.cx(control: int, target: int)',
    example: 'qc.cx(0, 1)'
  },
  cnot: {
    method: 'cnot',
    aliases: ['cx'],
    type: 'CNOT',
    numQubits: 2,
    description: 'Controlled-NOT (CNOT) gate. Flips target qubit if control qubit is |1⟩.',
    signature: 'qc.cnot(control: int, target: int)',
    example: 'qc.cnot(0, 1)'
  },
  cz: {
    method: 'cz',
    type: 'CZ',
    numQubits: 2,
    description: 'Controlled-Z gate. Applies Z to target if control is |1⟩.',
    signature: 'qc.cz(control: int, target: int)',
    example: 'qc.cz(0, 1)'
  },
  swap: {
    method: 'swap',
    type: 'SWAP',
    numQubits: 2,
    description: 'SWAP gate. Exchanges the quantum states of two qubits.',
    signature: 'qc.swap(qubit1: int, qubit2: int)',
    example: 'qc.swap(0, 1)'
  },
  rx: {
    method: 'rx',
    type: 'RX',
    numQubits: 1,
    hasParams: true,
    description: 'Parametric RX rotation. Rotates state around X-axis by angle θ (radians).',
    signature: 'qc.rx(theta: float, qubit: int)',
    example: 'qc.rx(3.14159, 0)'
  },
  ry: {
    method: 'ry',
    type: 'RY',
    numQubits: 1,
    hasParams: true,
    description: 'Parametric RY rotation. Rotates state around Y-axis by angle θ (radians).',
    signature: 'qc.ry(theta: float, qubit: int)',
    example: 'qc.ry(1.5708, 0)'
  },
  rz: {
    method: 'rz',
    type: 'RZ',
    numQubits: 1,
    hasParams: true,
    description: 'Parametric RZ rotation. Rotates state around Z-axis by angle θ (radians).',
    signature: 'qc.rz(theta: float, qubit: int)',
    example: 'qc.rz(0.7854, 0)'
  },
  measure: {
    method: 'measure',
    type: 'MEASURE',
    numQubits: 1,
    description: 'Born rule measurement of qubit into a classical readout register bit.',
    signature: 'qc.measure(qubit: int, cbit: int)',
    example: 'qc.measure(0, 0)'
  },
  measure_all: {
    method: 'measure_all',
    type: 'MEASURE',
    numQubits: 0,
    description: 'Measures all qubits into corresponding classical bits.',
    signature: 'qc.measure_all()',
    example: 'qc.measure_all()'
  }
};
