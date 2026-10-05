/**
 * QUANTUMANIA - Canonical Pure Classical Quantum State-Vector Simulator
 * Phase 4: Quantum Simulator
 * Independent of React UI & DOM. Mathematical core engine.
 */

import {
  CanonicalCircuit,
  SimulationOptions,
  SimulationResult
} from '../../../types/circuit';
import { validateCircuit } from '../domain/circuitDomain';
import {
  createInitialState,
  isNormalized,
  normalize,
  getProbabilityDistribution,
  formatStatevector,
  calculateBlochVectors
} from './stateVector';
import {
  GATE_MATRICES,
  applySingleQubitGate,
  applyCNOT,
  applyCZ,
  applySWAP,
  getRotationXMatrix,
  getRotationYMatrix,
  getRotationZMatrix
} from './gates';
import { sampleMeasurements } from './measurement';
import { generateEducationalExplanation } from './educationalExplanations';

/**
 * Simulates a canonical quantum circuit using exact classical state-vector evolution.
 * 
 * @param circuit Canonical circuit to simulate
 * @param options Configurable shots and custom RNG
 * @returns Fully populated SimulationResult adhering to docs/QUANTUM_SCHEMA.md Section 8
 */
export function simulateCircuit(
  circuit: CanonicalCircuit,
  options?: SimulationOptions
): SimulationResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const shots = options?.shots !== undefined ? options.shots : 1024;

  // 1. Circuit Validation
  const validation = validateCircuit(circuit);
  if (!validation.is_valid) {
    const elapsed = typeof performance !== 'undefined' ? performance.now() - t0 : Date.now() - t0;
    const errorMsg = validation.errors.map((e) => e.message).join(' | ');
    return {
      success: false,
      circuit_id: circuit.id,
      circuitId: circuit.id,
      qubits: circuit.qubits,
      depth: validation.depth,
      operationCount: validation.gate_count,
      shots,
      counts: {},
      measurementCounts: {},
      probabilities: {},
      statevector: [],
      execution_time_ms: Math.round(elapsed * 100) / 100,
      executionTimeMs: Math.round(elapsed * 100) / 100,
      error: errorMsg || 'Circuit failed validation'
    };
  }

  try {
    // 2. Sort operations by time-step column
    let sortedGates = [...circuit.gates].sort((a, b) => {
      if (a.step !== b.step) return a.step - b.step;
      return (a.target ?? 0) - (b.target ?? 0);
    });

    if (options?.stepIndex !== undefined) {
      sortedGates = sortedGates.filter((g) => g.step <= (options.stepIndex as number));
    }

    // 3. Initialize Ground State |00...0⟩
    let state = createInitialState(circuit.qubits);

    // 4. Sequential Gate Execution
    for (const gate of sortedGates) {
      const gType = gate.type;

      // Projective measurements are evaluated at end of circuit
      if (gType === 'MEASURE') {
        continue;
      }

      if (['X', 'Y', 'Z', 'H', 'S', 'T'].includes(gType)) {
        const target = gate.target !== undefined ? gate.target : gate.targets?.[0];
        if (target === undefined) {
          throw new Error(`Gate ${gType} requires a target qubit.`);
        }
        const matrix = GATE_MATRICES[gType];
        if (!matrix) {
          throw new Error(`Unsupported gate: ${gType}`);
        }
        state = applySingleQubitGate(state, matrix, target, circuit.qubits);
      } else if (['RX', 'RY', 'RZ'].includes(gType)) {
        const target = gate.target !== undefined ? gate.target : gate.targets?.[0];
        if (target === undefined) {
          throw new Error(`Gate ${gType} requires a target qubit.`);
        }
        const thetaParam = gate.params?.theta;
        const theta = typeof thetaParam === 'number' ? thetaParam : typeof thetaParam === 'string' ? parseFloat(thetaParam) || Math.PI / 2 : Math.PI / 2;
        const matrix = gType === 'RX' ? getRotationXMatrix(theta) : gType === 'RY' ? getRotationYMatrix(theta) : getRotationZMatrix(theta);
        state = applySingleQubitGate(state, matrix, target, circuit.qubits);
      } else if (gType === 'CNOT') {
        const ctrl = gate.control !== undefined ? gate.control : gate.controls?.[0];
        const tgt = gate.target !== undefined ? gate.target : gate.targets?.[0];
        if (ctrl === undefined || tgt === undefined) {
          throw new Error('CNOT gate requires both control and target qubits.');
        }
        if (ctrl === tgt) {
          throw new Error(`CNOT requires distinct control and target qubits: q${ctrl} === q${tgt}.`);
        }
        state = applyCNOT(state, ctrl, tgt, circuit.qubits);
      } else if (gType === 'CZ') {
        const ctrl = gate.control !== undefined ? gate.control : gate.controls?.[0];
        const tgt = gate.target !== undefined ? gate.target : gate.targets?.[0];
        if (ctrl === undefined || tgt === undefined) {
          throw new Error('CZ gate requires both control and target qubits.');
        }
        state = applyCZ(state, ctrl, tgt, circuit.qubits);
      } else if (gType === 'SWAP') {
        const targets = gate.targets || [];
        if (targets.length < 2) {
          throw new Error('SWAP gate requires 2 target qubits.');
        }
        state = applySWAP(state, targets[0], targets[1], circuit.qubits);
      } else {
        throw new Error(`Unsupported gate: ${gType}`);
      }
    }

    // 5. Numerical Stability & Normalization Check
    if (!isNormalized(state)) {
      state = normalize(state);
    }

    // 6. Compute Probabilities
    const probabilities = getProbabilityDistribution(state, circuit.qubits);

    // 7. Format Statevector
    const statevector = formatStatevector(state, circuit.qubits);

    // 8. Single-Qubit Reduced Bloch Vectors
    const bloch_vectors = calculateBlochVectors(state, circuit.qubits);

    // 9. Measurement Sampling
    const counts = shots > 0 ? sampleMeasurements(probabilities, shots, options?.rng) : {};

    // 10. Execution Time
    const elapsed = typeof performance !== 'undefined' ? performance.now() - t0 : Date.now() - t0;
    const executionTime = Math.round(elapsed * 100) / 100;

    // 11. Educational Explanation
    const insight = generateEducationalExplanation(circuit, probabilities);

    return {
      success: true,
      circuit_id: circuit.id,
      circuitId: circuit.id,
      qubits: circuit.qubits,
      depth: validation.depth,
      operationCount: circuit.gates.length,
      shots,
      counts,
      measurementCounts: counts,
      probabilities,
      statevector,
      bloch_vectors,
      execution_time_ms: executionTime,
      executionTimeMs: executionTime,
      explanation: `${insight.title}: ${insight.summary}`
    };
  } catch (err: unknown) {
    const elapsed = typeof performance !== 'undefined' ? performance.now() - t0 : Date.now() - t0;
    const message = err instanceof Error ? err.message : 'Simulation execution failed';
    return {
      success: false,
      circuit_id: circuit.id,
      circuitId: circuit.id,
      qubits: circuit.qubits,
      depth: validation.depth,
      operationCount: circuit.gates.length,
      shots,
      counts: {},
      measurementCounts: {},
      probabilities: {},
      statevector: [],
      execution_time_ms: Math.round(elapsed * 100) / 100,
      executionTimeMs: Math.round(elapsed * 100) / 100,
      error: message
    };
  }
}
