/**
 * QUANTUMANIA - Deterministic Quantum Code Generator
 * Feature: Drag & Drop Circuit Designer + Bidirectional Monaco Code Editor
 * Converts CanonicalCircuit -> Standard Python Quantum DSL Code
 */

import { CanonicalCircuit, QuantumGate } from '../../../types/circuit';
import { getGateTargets } from './circuitDomain';

export interface CodeGenerationResult {
  code: string;
  gateIdToLine: Map<string, number>;
  lineToGateId: Map<number, string>;
}

export function generateQuantumCode(circuit: CanonicalCircuit): CodeGenerationResult {
  const lines: string[] = [];
  const gateIdToLine = new Map<string, number>();
  const lineToGateId = new Map<number, string>();

  const addLine = (text: string, gateId?: string) => {
    lines.push(text);
    const lineNum = lines.length; // 1-indexed
    if (gateId) {
      gateIdToLine.set(gateId, lineNum);
      lineToGateId.set(lineNum, gateId);
    }
  };

  // 1. Header & Circuit Initialization
  addLine('# QUANTUMANIA Quantum Circuit');
  const cBits = circuit.classical_bits !== undefined ? circuit.classical_bits : circuit.qubits;
  if (cBits > 0 && cBits !== circuit.qubits) {
    addLine(`qc = QuantumCircuit(${circuit.qubits}, ${cBits})`);
  } else {
    addLine(`qc = QuantumCircuit(${circuit.qubits})`);
  }
  addLine('');

  // 2. Sort gates chronologically by step, then by target/control
  const sortedGates = [...(circuit.gates || [])].sort((a, b) => {
    if (a.step !== b.step) return a.step - b.step;
    const aQ = a.control !== undefined ? a.control : a.target ?? 0;
    const bQ = b.control !== undefined ? b.control : b.target ?? 0;
    return aQ - bQ;
  });

  const unitaryGates = sortedGates.filter((g) => g.type !== 'MEASURE');
  const measureGates = sortedGates.filter((g) => g.type === 'MEASURE');

  // 3. Render Unitary Gates
  if (unitaryGates.length > 0) {
    for (const gate of unitaryGates) {
      const lineStr = formatGateInstruction(gate);
      if (lineStr) {
        addLine(lineStr, gate.id);
      }
    }
  }

  // 4. Render Measurements
  if (measureGates.length > 0) {
    addLine('');
    for (const gate of measureGates) {
      const target = gate.target ?? (gate.targets && gate.targets[0]) ?? 0;
      // Find matching classical bit from circuit measurements or default to target
      let cbit = target;
      if (circuit.measurements) {
        const m = circuit.measurements.find((x) => x.qubit === target);
        if (m) cbit = m.classical_bit;
      }
      addLine(`qc.measure(${target}, ${cbit})`, gate.id);
    }
  }

  return {
    code: lines.join('\n'),
    gateIdToLine,
    lineToGateId
  };
}

function formatGateInstruction(gate: QuantumGate): string | null {
  const type = gate.type.toUpperCase();
  const target = gate.target ?? (gate.targets && gate.targets[0]) ?? 0;
  const control = gate.control ?? (gate.controls && gate.controls[0]) ?? 0;

  switch (type) {
    case 'H':
      return `qc.h(${target})`;
    case 'X':
      return `qc.x(${target})`;
    case 'Y':
      return `qc.y(${target})`;
    case 'Z':
      return `qc.z(${target})`;
    case 'S':
      return `qc.s(${target})`;
    case 'T':
      return `qc.t(${target})`;
    case 'CNOT':
      return `qc.cx(${control}, ${target})`;
    case 'CZ':
      return `qc.cz(${control}, ${target})`;
    case 'SWAP': {
      const targets = getGateTargets(gate);
      const q1 = targets[0] ?? control;
      const q2 = targets[1] ?? target;
      return `qc.swap(${q1}, ${q2})`;
    }
    case 'RX': {
      const theta = gate.params?.theta ?? 3.14159;
      return `qc.rx(${theta}, ${target})`;
    }
    case 'RY': {
      const theta = gate.params?.theta ?? 3.14159;
      return `qc.ry(${theta}, ${target})`;
    }
    case 'RZ': {
      const theta = gate.params?.theta ?? 3.14159;
      return `qc.rz(${theta}, ${target})`;
    }
    default:
      return `# Unsupported operation: ${type}`;
  }
}
