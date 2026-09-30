/**
 * QUANTUMANIA - Gate Unitary Matrices & Simulator Gate Operators
 * Phase 4: Quantum Simulator
 * Generic matrix application algorithms for single and multi-qubit gates
 */

import { Complex, complex, add, mul } from './complex';


export type GateMatrix2x2 = [
  [Complex, Complex],
  [Complex, Complex]
];

const INV_SQRT_2 = 1 / Math.SQRT2;

export const GATE_MATRICES: Record<string, GateMatrix2x2> = {
  // Pauli-X (NOT / Bit-flip)
  X: [
    [complex(0, 0), complex(1, 0)],
    [complex(1, 0), complex(0, 0)]
  ],

  // Pauli-Y (Bit + Phase flip)
  Y: [
    [complex(0, 0), complex(0, -1)],
    [complex(0, 1), complex(0, 0)]
  ],

  // Pauli-Z (Phase-flip)
  Z: [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(-1, 0)]
  ],

  // Hadamard (Equal Superposition)
  H: [
    [complex(INV_SQRT_2, 0), complex(INV_SQRT_2, 0)],
    [complex(INV_SQRT_2, 0), complex(-INV_SQRT_2, 0)]
  ],

  // Phase Gate S (π/2 phase shift)
  S: [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(0, 1)]
  ],

  // T Gate (π/4 phase shift)
  T: [
    [complex(1, 0), complex(0, 0)],
    [complex(0, 0), complex(INV_SQRT_2, INV_SQRT_2)]
  ]
};

/**
 * Generic single-qubit gate application:
 * Applies a 2x2 complex unitary matrix to target qubit in an N-qubit statevector.
 */
export function applySingleQubitGate(
  state: Complex[],
  matrix: GateMatrix2x2,
  targetQubit: number,
  numQubits: number
): Complex[] {
  const dim = 1 << numQubits;
  const nextState: Complex[] = new Array(dim);
  const mask = 1 << targetQubit;

  const [m00, m01] = matrix[0];
  const [m10, m11] = matrix[1];

  for (let k = 0; k < dim; k++) {
    if ((k & mask) === 0) {
      const i0 = k;
      const i1 = k | mask;

      const a0 = state[i0];
      const a1 = state[i1];

      // new_a0 = m00 * a0 + m01 * a1
      nextState[i0] = add(mul(m00, a0), mul(m01, a1));

      // new_a1 = m10 * a0 + m11 * a1
      nextState[i1] = add(mul(m10, a0), mul(m11, a1));
    }
  }

  return nextState;
}

/**
 * Controlled-NOT (CNOT / CX):
 * Flips the target qubit if and only if the control qubit is 1.
 */
export function applyCNOT(
  state: Complex[],
  controlQubit: number,
  targetQubit: number,
  numQubits: number
): Complex[] {
  if (controlQubit === targetQubit) {
    throw new Error('CNOT control and target qubits cannot be identical.');
  }

  const dim = 1 << numQubits;
  const nextState: Complex[] = new Array(dim);
  const cMask = 1 << controlQubit;
  const tMask = 1 << targetQubit;

  for (let k = 0; k < dim; k++) {
    const isControlOne = (k & cMask) !== 0;

    if (isControlOne) {
      // If control is 1, flip target qubit
      const paired = k ^ tMask;
      nextState[k] = state[paired];
    } else {
      // If control is 0, amplitude is unchanged
      nextState[k] = state[k];
    }
  }

  return nextState;
}

/**
 * Controlled-Z (CZ):
 * Flips sign if both control and target are 1.
 */
export function applyCZ(
  state: Complex[],
  controlQubit: number,
  targetQubit: number,
  numQubits: number
): Complex[] {
  const dim = 1 << numQubits;
  const nextState: Complex[] = new Array(dim);
  const cMask = 1 << controlQubit;
  const tMask = 1 << targetQubit;

  for (let k = 0; k < dim; k++) {
    if ((k & cMask) !== 0 && (k & tMask) !== 0) {
      nextState[k] = complex(-state[k].real, -state[k].imag);
    } else {
      nextState[k] = state[k];
    }
  }

  return nextState;
}

/**
 * SWAP Gate:
 * Swaps states of two qubits.
 */
export function applySWAP(
  state: Complex[],
  q1: number,
  q2: number,
  numQubits: number
): Complex[] {
  const dim = 1 << numQubits;
  const nextState: Complex[] = new Array(dim);
  const m1 = 1 << q1;
  const m2 = 1 << q2;

  for (let k = 0; k < dim; k++) {
    const b1 = (k & m1) !== 0 ? 1 : 0;
    const b2 = (k & m2) !== 0 ? 1 : 0;

    if (b1 !== b2) {
      const swapped = k ^ m1 ^ m2;
      nextState[k] = state[swapped];
    } else {
      nextState[k] = state[k];
    }
  }

  return nextState;
}
