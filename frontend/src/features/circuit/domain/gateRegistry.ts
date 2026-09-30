/**
 * QUANTUMANIA - Centralized Quantum Gate Registry
 * Phase 3: Quantum Circuit Builder
 */

import { GateType, GateDefinition } from '../../../types/circuit';

export const GATE_REGISTRY: Record<GateType, GateDefinition> = {
  H: {
    type: 'H',
    symbol: 'H',
    name: 'Hadamard',
    category: 'basic',
    description: 'Creates an equal superposition state from a computational basis state: H|0⟩ = (|0⟩ + |1⟩)/√2.',
    qubitsRequired: 1,
    matrixPreview: '1/√2 [[1, 1], [1, -1]]',
    accessibleLabel: 'Hadamard Gate (Superposition)',
    badgeColor: 'var(--accent-cyan)'
  },
  X: {
    type: 'X',
    symbol: 'X',
    name: 'Pauli-X',
    category: 'basic',
    description: 'Quantum NOT gate. Flips |0⟩ to |1⟩ and |1⟩ to |0⟩.',
    qubitsRequired: 1,
    matrixPreview: '[[0, 1], [1, 0]]',
    accessibleLabel: 'Pauli-X Gate (Bit-flip NOT)',
    badgeColor: 'var(--accent-cyan)'
  },
  Y: {
    type: 'Y',
    symbol: 'Y',
    name: 'Pauli-Y',
    category: 'basic',
    description: 'Applies combined bit-flip and phase-flip: Y|0⟩ = i|1⟩, Y|1⟩ = -i|0⟩.',
    qubitsRequired: 1,
    matrixPreview: '[[0, -i], [i, 0]]',
    accessibleLabel: 'Pauli-Y Gate (Bit & Phase flip)',
    badgeColor: 'var(--accent-cyan)'
  },
  Z: {
    type: 'Z',
    symbol: 'Z',
    name: 'Pauli-Z',
    category: 'basic',
    description: 'Phase-flip gate. Leaves |0⟩ unchanged and maps |1⟩ to -|1⟩.',
    qubitsRequired: 1,
    matrixPreview: '[[1, 0], [0, -1]]',
    accessibleLabel: 'Pauli-Z Gate (Phase-flip)',
    badgeColor: 'var(--accent-cyan)'
  },
  S: {
    type: 'S',
    symbol: 'S',
    name: 'Phase (S)',
    category: 'phase',
    description: 'Applies a π/2 phase rotation around the Z-axis (square root of Z gate).',
    qubitsRequired: 1,
    matrixPreview: '[[1, 0], [0, i]]',
    accessibleLabel: 'S Phase Gate (π/2 phase shift)',
    badgeColor: 'var(--accent-amber)'
  },
  T: {
    type: 'T',
    symbol: 'T',
    name: 'T Gate',
    category: 'phase',
    description: 'Applies a π/4 phase rotation around the Z-axis (fourth root of Z gate).',
    qubitsRequired: 1,
    matrixPreview: '[[1, 0], [0, e^(iπ/4)]]',
    accessibleLabel: 'T Gate (π/4 phase shift)',
    badgeColor: 'var(--accent-amber)'
  },
  CNOT: {
    type: 'CNOT',
    symbol: 'CX',
    name: 'Controlled-NOT',
    category: 'controlled',
    description: 'Entangling 2-qubit gate. Flips the target qubit if and only if the control qubit is |1⟩.',
    qubitsRequired: 2,
    matrixPreview: '4x4 Controlled Permutation',
    accessibleLabel: 'Controlled-NOT Gate (CNOT/CX)',
    badgeColor: 'var(--accent-purple)'
  },
  MEASURE: {
    type: 'MEASURE',
    symbol: 'M',
    name: 'Measurement',
    category: 'measurement',
    description: 'Projective Born rule measurement onto the computational basis {|0⟩, |1⟩}.',
    qubitsRequired: 1,
    matrixPreview: 'Projective Collapse',
    accessibleLabel: 'Measurement Operation (Classical readout)',
    badgeColor: 'var(--accent-emerald)'
  },
  SWAP: {
    type: 'SWAP',
    symbol: 'SWAP',
    name: 'Swap Gate',
    category: 'controlled',
    description: 'Exchanges the quantum states of two qubits.',
    qubitsRequired: 2,
    matrixPreview: '4x4 Swap Permutation',
    accessibleLabel: 'Swap Gate',
    badgeColor: 'var(--accent-purple)'
  },
  CZ: {
    type: 'CZ',
    symbol: 'CZ',
    name: 'Controlled-Z',
    category: 'controlled',
    description: 'Applies a Pauli-Z phase flip to the target if the control is in state |1⟩.',
    qubitsRequired: 2,
    matrixPreview: 'diag(1, 1, 1, -1)',
    accessibleLabel: 'Controlled-Z Gate',
    badgeColor: 'var(--accent-purple)'
  },
  RX: {
    type: 'RX',
    symbol: 'RX',
    name: 'Rotation-X',
    category: 'parametric',
    description: 'Rotates state around X-axis by angle θ.',
    qubitsRequired: 1,
    matrixPreview: 'cos(θ/2)I - i sin(θ/2)X',
    accessibleLabel: 'Parametric RX Gate',
    badgeColor: 'var(--accent-cyan)'
  },
  RY: {
    type: 'RY',
    symbol: 'RY',
    name: 'Rotation-Y',
    category: 'parametric',
    description: 'Rotates state around Y-axis by angle θ.',
    qubitsRequired: 1,
    matrixPreview: 'cos(θ/2)I - i sin(θ/2)Y',
    accessibleLabel: 'Parametric RY Gate',
    badgeColor: 'var(--accent-cyan)'
  },
  RZ: {
    type: 'RZ',
    symbol: 'RZ',
    name: 'Rotation-Z',
    category: 'parametric',
    description: 'Rotates state around Z-axis by angle θ.',
    qubitsRequired: 1,
    matrixPreview: 'exp(-i θ/2 Z)',
    accessibleLabel: 'Parametric RZ Gate',
    badgeColor: 'var(--accent-cyan)'
  }
};

export const PALETTE_GATES: GateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T', 'CNOT', 'MEASURE'];
