/**
 * QUANTUMANIA - Quantum State Vector & Observables Library
 * Phase 4: Quantum Simulator
 * Conforms to Little-Endian Qiskit Standard (docs/QUANTUM_SCHEMA.md Section 4)
 */

import { Complex, complex, mul, conj, magSq, phase, EPSILON } from './complex';

export interface StatevectorEntry {
  basis: string;
  real: number;
  imag: number;
  magnitude: number;
  phase_rad: number;
}

export interface BlochVector {
  qubit: number;
  x: number;
  y: number;
  z: number;
}

/**
 * Creates the initial ground state |00...0⟩ for N qubits
 */
export function createInitialState(numQubits: number): Complex[] {
  const dim = 1 << numQubits;
  const state: Complex[] = new Array(dim);
  state[0] = complex(1, 0);
  for (let i = 1; i < dim; i++) {
    state[i] = complex(0, 0);
  }
  return state;
}

/**
 * Converts a basis state index (0 to 2^n - 1) to its binary string representation
 * Little-Endian: qubit 0 is the rightmost bit, qubit (n-1) is the leftmost bit.
 */
export function indexToBitstring(index: number, numQubits: number): string {
  let s = '';
  for (let q = numQubits - 1; q >= 0; q--) {
    const bit = (index >> q) & 1;
    s += bit ? '1' : '0';
  }
  return s;
}

/**
 * Checks whether the statevector sum of squared magnitudes equals 1 within tolerance
 */
export function isNormalized(state: Complex[], eps = 1e-6): boolean {
  let sum = 0;
  for (const amp of state) {
    sum += magSq(amp);
  }
  return Math.abs(sum - 1) < eps;
}

/**
 * Normalizes statevector amplitudes if slight floating-point drift occurred
 */
export function normalize(state: Complex[]): Complex[] {
  let sum = 0;
  for (const amp of state) {
    sum += magSq(amp);
  }
  if (sum < EPSILON) {
    throw new Error('Statevector has norm 0 and cannot be normalized.');
  }
  const norm = Math.sqrt(sum);
  return state.map((amp) => complex(amp.real / norm, amp.imag / norm));
}

/**
 * Computes theoretical probability distribution for all 2^N basis states
 */
export function getProbabilityDistribution(
  state: Complex[],
  numQubits: number
): Record<string, number> {
  const dist: Record<string, number> = {};
  const dim = 1 << numQubits;

  for (let i = 0; i < dim; i++) {
    const bitstring = indexToBitstring(i, numQubits);
    const p = magSq(state[i]);
    dist[bitstring] = Math.abs(p) < EPSILON ? 0 : Math.min(1, Math.max(0, p));
  }

  return dist;
}

/**
 * Formats statevector for canonical JSON schema
 */
export function formatStatevector(
  state: Complex[],
  numQubits: number
): StatevectorEntry[] {
  const dim = 1 << numQubits;
  const result: StatevectorEntry[] = [];

  for (let i = 0; i < dim; i++) {
    const amp = state[i];
    const bitstring = indexToBitstring(i, numQubits);
    const magnitude = magSq(amp);
    const phaseRad = phase(amp);

    result.push({
      basis: bitstring,
      real: Math.abs(amp.real) < EPSILON ? 0 : amp.real,
      imag: Math.abs(amp.imag) < EPSILON ? 0 : amp.imag,
      magnitude: Math.abs(magnitude) < EPSILON ? 0 : Math.min(1, Math.max(0, magnitude)),
      phase_rad: Math.abs(phaseRad) < EPSILON ? 0 : phaseRad
    });
  }

  return result;
}

/**
 * Computes single-qubit reduced Bloch coordinates (x, y, z) for each qubit
 *
 * <Z_j> = sum_k (-1)^(bit_j) * |alpha_k|^2
 * <X_j> = 2 * sum_{k: bit_j=0} Re(alpha_k* * alpha_{k ^ 2^j})
 * <Y_j> = 2 * sum_{k: bit_j=0} Im(alpha_k* * alpha_{k ^ 2^j})
 */
export function calculateAllBlochVectors(
  state: Complex[],
  numQubits: number
): BlochVector[] {
  const blochVectors: BlochVector[] = [];
  const dim = 1 << numQubits;

  for (let q = 0; q < numQubits; q++) {
    const mask = 1 << q;
    let z = 0;
    let x = 0;
    let y = 0;

    for (let k = 0; k < dim; k++) {
      const bit = (k >> q) & 1;
      const p = magSq(state[k]);
      z += bit ? -p : p;

      if (bit === 0) {
        const paired = k | mask;
        const cAmp = conj(state[k]);
        const cross = mul(cAmp, state[paired]);
        x += 2 * cross.real;
        y += 2 * cross.imag;
      }
    }

    blochVectors.push({
      qubit: q,
      x: Math.abs(x) < EPSILON ? 0 : Math.max(-1, Math.min(1, x)),
      y: Math.abs(y) < EPSILON ? 0 : Math.max(-1, Math.min(1, y)),
      z: Math.abs(z) < EPSILON ? 0 : Math.max(-1, Math.min(1, z))
    });
  }

  return blochVectors;
}

export const calculateBlochVectors = calculateAllBlochVectors;

