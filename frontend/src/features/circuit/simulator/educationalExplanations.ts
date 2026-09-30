/**
 * QUANTUMANIA - Deterministic Educational Explanations Engine
 * Phase 4: Quantum Simulator
 * Generates verified, deterministic pedagogical insights based strictly on circuit structure and probabilities.
 */

import { CanonicalCircuit } from '../../../types/circuit';

export interface EducationalInsight {
  title: string;
  summary: string;
  phenomenon: 'superposition' | 'entanglement' | 'bit_flip' | 'phase_flip' | 'interference' | 'deterministic';
  details: string[];
}

export function generateEducationalExplanation(
  circuit: CanonicalCircuit,
  probabilities: Record<string, number>
): EducationalInsight {
  const gateTypes = circuit.gates.map((g) => g.type);
  const hasHadamard = gateTypes.includes('H');
  const hasCNOT = gateTypes.includes('CNOT');
  const hasX = gateTypes.includes('X');
  const hasZ = gateTypes.includes('Z');
  const hasPhase = gateTypes.includes('S') || gateTypes.includes('T');

  const nonZeroStates = Object.entries(probabilities).filter(([_, p]) => p > 0.001);

  // 1. Bell State / Entangled State Check
  if (hasHadamard && hasCNOT && circuit.qubits === 2) {
    const isBell =
      nonZeroStates.length === 2 &&
      probabilities['00'] > 0.4 &&
      probabilities['11'] > 0.4;

    if (isBell) {
      return {
        title: 'Maximally Entangled Bell State |Φ+⟩',
        phenomenon: 'entanglement',
        summary:
          'This circuit creates an entangled Einstein-Podolsky-Rosen (EPR) Bell pair. The two qubits exhibit perfect measurement correlations.',
        details: [
          'Hadamard on q0 creates an equal superposition: (|0⟩ + |1⟩)/√2.',
          'The CNOT gate entangles q0 and q1: whenever q0 is |1⟩, q1 is flipped to |1⟩.',
          'Final state: (|00⟩ + |11⟩)/√2. Measuring 0 on q0 instantly guarantees q1 will measure 0; measuring 1 on q0 guarantees q1 will measure 1.'
        ]
      };
    }
  }

  // 2. GHZ State Check
  if (hasHadamard && hasCNOT && circuit.qubits === 3) {
    const isGhz =
      nonZeroStates.length === 2 &&
      probabilities['000'] > 0.4 &&
      probabilities['111'] > 0.4;

    if (isGhz) {
      return {
        title: 'Greenberger-Horne-Zeilinger (GHZ) Tripartite Entanglement',
        phenomenon: 'entanglement',
        summary:
          'This circuit creates a 3-qubit maximally entangled state: (|000⟩ + |111⟩)/√2.',
        details: [
          'Hadamard puts q0 in superposition, and cascaded CNOTs propagate entanglement to q1 and q2.',
          'All three qubits are non-separable and collapse to identical binary values upon measurement.'
        ]
      };
    }
  }

  // 3. Destructive Interference Check (H then H)
  if (circuit.qubits === 1 && gateTypes.filter((g) => g === 'H').length === 2) {
    if (probabilities['0'] > 0.99) {
      return {
        title: 'Quantum Interference (H² = I)',
        phenomenon: 'interference',
        summary:
          'Applying two consecutive Hadamard gates returns the qubit to its original |0⟩ ground state through quantum phase cancellation.',
        details: [
          'The first H gate creates the superposition state |+⟩ = (|0⟩ + |1⟩)/√2.',
          'The second H gate causes constructive interference for |0⟩ and destructive interference for |1⟩.',
          'Because H is its own inverse (H · H = I), the qubit returns deterministically to |0⟩.'
        ]
      };
    }
  }

  // 4. Single-qubit Superposition Check
  if (hasHadamard && !hasCNOT && circuit.qubits === 1) {
    return {
      title: 'Equal Quantum Superposition',
      phenomenon: 'superposition',
      summary:
        'The Hadamard gate rotates the computational basis state |0⟩ into an equal linear combination of |0⟩ and |1⟩.',
      details: [
        'State vector: 1/√2 |0⟩ + 1/√2 |1⟩.',
        'Theoretical measurement probabilities are exactly 50% for 0 and 50% for 1.',
        'The qubit is not secretly 0 or 1 prior to measurement; measurement forces a projective collapse.'
      ]
    };
  }

  // 5. Pure Bit Flip (X gate)
  if (hasX && !hasHadamard && !hasCNOT) {
    return {
      title: 'Deterministic Bit-Flip (Pauli-X)',
      phenomenon: 'bit_flip',
      summary:
        'The Pauli-X gate acts as a quantum NOT gate, rotating the state vector by π radians around the X-axis.',
      details: [
        'X|0⟩ = |1⟩ and X|1⟩ = |0⟩.',
        'Measurement outcomes are 100% deterministic (zero quantum randomness).'
      ]
    };
  }

  // 6. Phase Gate (Z, S, T)
  if (hasPhase || hasZ) {
    return {
      title: 'Relative Phase Rotation',
      phenomenon: 'phase_flip',
      summary:
        'Phase gates alter the complex phase angle of state amplitudes without modifying their measurement probabilities in the computational basis.',
      details: [
        'Z maps |1⟩ to -|1⟩ (π phase shift).',
        'S maps |1⟩ to i|1⟩ (π/2 phase shift).',
        'T maps |1⟩ to e^(iπ/4)|1⟩ (π/4 phase shift).',
        'Relative phase is observable when interference gates like Hadamard follow.'
      ]
    };
  }

  // Default General Summary
  return {
    title: 'Quantum State Evolution',
    phenomenon: 'deterministic',
    summary:
      `The circuit executed ${circuit.gates.length} unitary operations across ${circuit.qubits} qubit(s), resulting in ${nonZeroStates.length} non-zero basis state(s).`,
    details: [
      `Total state space dimension: ${1 << circuit.qubits} complex amplitudes.`,
      `Circuit depth: ${circuit.gates.reduce((m, g) => Math.max(m, g.step + 1), 0)} sequential time columns.`
    ]
  };
}
