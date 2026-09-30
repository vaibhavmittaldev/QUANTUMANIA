/**
 * QUANTUMANIA - Pure Quantum Circuit Domain Logic & Validation Engine
 * Phase 3: Quantum Circuit Builder
 * Independent of React UI / DOM structure
 */

import {
  CanonicalCircuit,
  QuantumGate,
  CircuitValidationResult,
  CircuitValidationError
} from '../../../types/circuit';
import { GATE_REGISTRY } from './gateRegistry';

export const MIN_QUBITS = 1;
export const MAX_QUBITS = 8;
export const MAX_DEPTH = 100;
export const MAX_OPERATIONS = 500;

export function generateGateId(): string {
  return 'op_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

export function createEmptyCircuit(
  qubits = 2,
  classicalBits = 2,
  name = 'Untitled Circuit'
): CanonicalCircuit {
  const boundedQubits = Math.max(MIN_QUBITS, Math.min(MAX_QUBITS, qubits));
  const boundedBits = Math.max(0, Math.min(10, classicalBits));

  return {
    schema_version: '1.0.0',
    name,
    description: 'Interactive quantum circuit canvas',
    qubits: boundedQubits,
    classical_bits: boundedBits,
    gates: [],
    measurements: []
  };
}

export function cloneCircuit(circuit: CanonicalCircuit): CanonicalCircuit {
  return JSON.parse(JSON.stringify(circuit));
}

export function calculateDepth(circuit: CanonicalCircuit): number {
  if (!circuit.gates || circuit.gates.length === 0) {
    return 0;
  }
  let maxStep = -1;
  for (const gate of circuit.gates) {
    if (gate.step > maxStep) {
      maxStep = gate.step;
    }
  }
  return maxStep >= 0 ? maxStep + 1 : 0;
}

export function getGateTargets(gate: QuantumGate): number[] {
  if (gate.targets && gate.targets.length > 0) return gate.targets;
  if (gate.target !== undefined && gate.target !== null) return [gate.target];
  return [];
}

export function getGateControls(gate: QuantumGate): number[] {
  if (gate.controls && gate.controls.length > 0) return gate.controls;
  if (gate.control !== undefined && gate.control !== null) return [gate.control];
  return [];
}

export function validateCircuit(circuit: CanonicalCircuit): CircuitValidationResult {
  const errors: CircuitValidationError[] = [];
  const warnings: string[] = [];

  if (circuit.schema_version !== '1.0.0') {
    errors.push({
      message: `Invalid schema version '${circuit.schema_version}'. Expected '1.0.0'.`,
      violation: 'SCHEMA_VERSION_INVALID'
    });
  }

  if (circuit.qubits < MIN_QUBITS) {
    errors.push({
      message: `Circuit must have at least ${MIN_QUBITS} qubit.`,
      violation: 'MIN_QUBITS_VIOLATION'
    });
  } else if (circuit.qubits > MAX_QUBITS) {
    errors.push({
      message: `Circuit exceeds maximum supported qubits (${MAX_QUBITS}).`,
      violation: 'MAX_QUBITS_EXCEEDED'
    });
  }

  if (circuit.classical_bits < 0 || circuit.classical_bits > 10) {
    errors.push({
      message: 'Classical bits must be between 0 and 10.',
      violation: 'CLASSICAL_BITS_OUT_OF_BOUNDS'
    });
  }

  if (circuit.gates.length > MAX_OPERATIONS) {
    errors.push({
      message: `Circuit exceeds maximum operations limit (${MAX_OPERATIONS}).`,
      violation: 'MAX_OPERATIONS_EXCEEDED'
    });
  }

  // Collision map: "step:qubit" -> gate_id
  const occupiedSlots = new Map<string, string>();
  let maxStep = -1;

  for (let idx = 0; idx < circuit.gates.length; idx++) {
    const gate = circuit.gates[idx];
    const gType = gate.type;
    const step = gate.step;

    if (step > maxStep) maxStep = step;

    if (step < 0) {
      errors.push({
        gate_id: gate.id,
        gate_index: idx,
        gate_type: gType,
        message: `Gate step index (${step}) cannot be negative.`,
        violation: 'INVALID_STEP_INDEX'
      });
    } else if (step >= MAX_DEPTH) {
      errors.push({
        gate_id: gate.id,
        gate_index: idx,
        gate_type: gType,
        message: `Gate step (${step}) exceeds maximum depth limit (${MAX_DEPTH}).`,
        violation: 'MAX_DEPTH_EXCEEDED'
      });
    }

    if (!GATE_REGISTRY[gType]) {
      errors.push({
        gate_id: gate.id,
        gate_index: idx,
        gate_type: gType,
        message: `Unknown or unsupported quantum gate type '${gType}'.`,
        violation: 'UNSUPPORTED_GATE'
      });
      continue;
    }

    const targets = getGateTargets(gate);
    const controls = getGateControls(gate);

    // Validate targets within bounds
    for (const t of targets) {
      if (t < 0 || t >= circuit.qubits) {
        errors.push({
          gate_id: gate.id,
          gate_index: idx,
          gate_type: gType,
          message: `Target qubit index q${t} is out of bounds (circuit has ${circuit.qubits} qubits).`,
          violation: 'QUBIT_OUT_OF_BOUNDS'
        });
      }
    }

    // Validate controls within bounds
    for (const c of controls) {
      if (c < 0 || c >= circuit.qubits) {
        errors.push({
          gate_id: gate.id,
          gate_index: idx,
          gate_type: gType,
          message: `Control qubit index q${c} is out of bounds (circuit has ${circuit.qubits} qubits).`,
          violation: 'QUBIT_OUT_OF_BOUNDS'
        });
      }
    }

    // Gate specific rules
    if (gType === 'CNOT') {
      if (controls.length === 0) {
        errors.push({
          gate_id: gate.id,
          gate_index: idx,
          gate_type: gType,
          message: 'CNOT gate requires a control qubit.',
          violation: 'MISSING_CONTROL'
        });
      }
      if (targets.length === 0) {
        errors.push({
          gate_id: gate.id,
          gate_index: idx,
          gate_type: gType,
          message: 'CNOT gate requires a target qubit.',
          violation: 'MISSING_TARGET'
        });
      }
      if (controls.length > 0 && targets.length > 0) {
        const ctrl = controls[0];
        const tgt = targets[0];
        if (ctrl === tgt) {
          errors.push({
            gate_id: gate.id,
            gate_index: idx,
            gate_type: gType,
            message: `A CNOT gate requires two different qubits: control (q${ctrl}) and target (q${tgt}) cannot be identical.`,
            violation: 'CONTROL_EQUALS_TARGET'
          });
        }
      }
    } else if (['X', 'Y', 'Z', 'H', 'S', 'T'].includes(gType)) {
      if (targets.length === 0) {
        errors.push({
          gate_id: gate.id,
          gate_index: idx,
          gate_type: gType,
          message: `${gType} gate requires a target qubit.`,
          violation: 'MISSING_TARGET'
        });
      } else if (targets.length > 1) {
        errors.push({
          gate_id: gate.id,
          gate_index: idx,
          gate_type: gType,
          message: `Single-qubit ${gType} gate cannot act on multiple targets simultaneously.`,
          violation: 'EXCESS_TARGETS'
        });
      }
    } else if (gType === 'MEASURE') {
      if (targets.length === 0) {
        errors.push({
          gate_id: gate.id,
          gate_index: idx,
          gate_type: gType,
          message: 'Measurement requires a target qubit.',
          violation: 'MISSING_TARGET'
        });
      }
    }

    // Collision detection
    const activeQubits = new Set([...targets, ...controls]);
    for (const q of activeQubits) {
      if (q >= 0 && q < circuit.qubits) {
        const key = `${step}:${q}`;
        if (occupiedSlots.has(key)) {
          errors.push({
            gate_id: gate.id,
            gate_index: idx,
            gate_type: gType,
            message: `Collision at time step ${step} on qubit q${q}: multiple operations overlap.`,
            violation: 'QUBIT_COLLISION'
          });
        } else {
          occupiedSlots.set(key, gate.id);
        }
      }
    }
  }

  // Educational advice warnings
  const hasGates = circuit.gates.length > 0;
  const hasMeasurement = circuit.gates.some((g) => g.type === 'MEASURE') || (circuit.measurements && circuit.measurements.length > 0);
  if (hasGates && !hasMeasurement) {
    warnings.push('Circuit has quantum gates but no measurements. Measurements are needed to read out classical bit distributions in Phase 4.');
  }

  const depth = maxStep >= 0 ? maxStep + 1 : 0;

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    depth,
    gate_count: circuit.gates.length,
    qubits: circuit.qubits,
    classical_bits: circuit.classical_bits
  };
}

export function addGate(
  circuit: CanonicalCircuit,
  gateInput: Omit<QuantumGate, 'id'> & { id?: string }
): { circuit: CanonicalCircuit; error?: string } {
  const newGate: QuantumGate = {
    ...gateInput,
    id: gateInput.id || generateGateId()
  };

  // Build tentative updated circuit
  const nextCircuit = cloneCircuit(circuit);

  // If there's an existing gate on the same target at this step, replace it or reject
  const targetQubits = getGateTargets(newGate);
  const controlQubits = getGateControls(newGate);
  const newActiveQubits = new Set([...targetQubits, ...controlQubits]);

  // Remove existing gate occupying any of these qubits at this exact step to allow seamless replacement
  nextCircuit.gates = nextCircuit.gates.filter((g) => {
    if (g.step !== newGate.step) return true;
    const gTargets = getGateTargets(g);
    const gControls = getGateControls(g);
    const gActive = new Set([...gTargets, ...gControls]);
    for (const q of newActiveQubits) {
      if (gActive.has(q)) {
        return false; // Remove colliding gate
      }
    }
    return true;
  });

  nextCircuit.gates.push(newGate);

  // Synchronize measurements list if MEASURE gate is placed
  if (newGate.type === 'MEASURE' && newGate.target !== undefined) {
    const q = newGate.target;
    if (!nextCircuit.measurements) nextCircuit.measurements = [];
    if (!nextCircuit.measurements.some((m) => m.qubit === q)) {
      nextCircuit.measurements.push({ qubit: q, classical_bit: Math.min(q, Math.max(0, nextCircuit.classical_bits - 1)) });
    }
  }

  const validation = validateCircuit(nextCircuit);
  if (!validation.is_valid) {
    return {
      circuit,
      error: validation.errors[0]?.message || 'Operation violates quantum circuit constraints.'
    };
  }

  return { circuit: nextCircuit };
}

export function removeGate(circuit: CanonicalCircuit, gateId: string): CanonicalCircuit {
  const next = cloneCircuit(circuit);
  const targetGate = next.gates.find((g) => g.id === gateId);
  next.gates = next.gates.filter((g) => g.id !== gateId);

  // If removed a measurement gate, remove associated measurement mapping if no other measure on that qubit
  if (targetGate && targetGate.type === 'MEASURE' && targetGate.target !== undefined) {
    const remainingMeasure = next.gates.some(
      (g) => g.type === 'MEASURE' && g.target === targetGate.target
    );
    if (!remainingMeasure && next.measurements) {
      next.measurements = next.measurements.filter((m) => m.qubit !== targetGate.target);
    }
  }

  return next;
}

export function updateGate(
  circuit: CanonicalCircuit,
  gateId: string,
  updates: Partial<QuantumGate>
): { circuit: CanonicalCircuit; error?: string } {
  const next = cloneCircuit(circuit);
  const gateIdx = next.gates.findIndex((g) => g.id === gateId);
  if (gateIdx === -1) {
    return { circuit, error: `Gate with ID '${gateId}' not found.` };
  }

  next.gates[gateIdx] = {
    ...next.gates[gateIdx],
    ...updates
  };

  const validation = validateCircuit(next);
  if (!validation.is_valid) {
    return {
      circuit,
      error: validation.errors[0]?.message || 'Update violates circuit constraints.'
    };
  }

  return { circuit: next };
}

export function setQubitCount(
  circuit: CanonicalCircuit,
  newCount: number
): { circuit: CanonicalCircuit; error?: string } {
  if (newCount < MIN_QUBITS || newCount > MAX_QUBITS) {
    return {
      circuit,
      error: `Qubits must be between ${MIN_QUBITS} and ${MAX_QUBITS}.`
    };
  }

  const next = cloneCircuit(circuit);
  next.qubits = newCount;
  next.classical_bits = newCount;

  // Filter out any gates that acted on qubits that no longer exist
  next.gates = next.gates.filter((g) => {
    const targets = getGateTargets(g);
    const controls = getGateControls(g);
    return targets.every((t) => t < newCount) && controls.every((c) => c < newCount);
  });

  if (next.measurements) {
    next.measurements = next.measurements.filter((m) => m.qubit < newCount && m.classical_bit < newCount);
  }

  return { circuit: next };
}

export function serializeCircuit(circuit: CanonicalCircuit): string {
  return JSON.stringify(circuit, null, 2);
}

export function deserializeCircuit(jsonString: string): {
  circuit?: CanonicalCircuit;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString) as CanonicalCircuit;
    if (!parsed || typeof parsed !== 'object') {
      return { error: 'Invalid JSON: Expected a JSON object representing a Quantum Circuit.' };
    }
    if (!parsed.schema_version || parsed.schema_version !== '1.0.0') {
      return { error: "Missing or unsupported 'schema_version'. Expected '1.0.0'." };
    }
    if (typeof parsed.qubits !== 'number' || parsed.qubits < 1) {
      return { error: "Circuit must specify a valid positive integer for 'qubits'." };
    }
    if (!Array.isArray(parsed.gates)) {
      parsed.gates = [];
    }
    // Ensure all gates have IDs
    parsed.gates = parsed.gates.map((g) => ({
      ...g,
      id: g.id || generateGateId()
    }));

    const validation = validateCircuit(parsed);
    if (!validation.is_valid) {
      return {
        circuit: parsed,
        error: `Circuit contains validation errors: ${validation.errors[0]?.message}`
      };
    }
    return { circuit: parsed };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? `JSON syntax error: ${err.message}` : 'Failed to parse JSON circuit.'
    };
  }
}
