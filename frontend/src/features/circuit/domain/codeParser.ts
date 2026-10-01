/**
 * QUANTUMANIA - Robust Quantum Code Parser
 * Feature: Drag & Drop Circuit Designer + Bidirectional Monaco Code Editor
 * Parses Standard Python Quantum DSL Code -> CanonicalCircuit with Monaco Diagnostics
 */

import { CanonicalCircuit, QuantumGate, MeasurementMapping } from '../../../types/circuit';
import { MIN_QUBITS, MAX_QUBITS, generateGateId, validateCircuit } from './circuitDomain';
import { DslDiagnostic, DslParseResult, QUANTUM_DSL_OPS } from './dslTypes';

export function parseQuantumCode(sourceCode: string): DslParseResult {
  const diagnostics: DslDiagnostic[] = [];
  const lineToGateId = new Map<number, string>();
  const gateIdToLine = new Map<string, number>();

  const lines = sourceCode.split('\n');

  let numQubits = 2;
  let numClassicalBits = 2;
  let circuitInitialized = false;
  let initLineNum = -1;

  const rawInstructions: Array<{
    lineNum: number;
    method: string;
    argsStr: string;
    rawLine: string;
  }> = [];

  // Pass 1: Line by line scanning & QuantumCircuit initialization
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines and full comment lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Check for QuantumCircuit declaration: e.g. qc = QuantumCircuit(2) or QuantumCircuit(2, 2)
    const initMatch = trimmed.match(/^(?:qc\s*=\s*)?QuantumCircuit\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\)/i);
    if (initMatch) {
      if (circuitInitialized) {
        diagnostics.push({
          line: lineNum,
          startColumn: 1,
          endColumn: rawLine.length + 1,
          message: 'Multiple QuantumCircuit initializations found. Only the first will define dimensions.',
          severity: 'warning'
        });
        continue;
      }

      const qCount = parseInt(initMatch[1], 10);
      const cCount = initMatch[2] !== undefined ? parseInt(initMatch[2], 10) : qCount;

      if (qCount < MIN_QUBITS || qCount > MAX_QUBITS) {
        diagnostics.push({
          line: lineNum,
          startColumn: rawLine.indexOf(initMatch[1]) + 1,
          endColumn: rawLine.indexOf(initMatch[1]) + initMatch[1].length + 1,
          message: `Supported qubit allocation is between ${MIN_QUBITS} and ${MAX_QUBITS} (received ${qCount}).`,
          severity: 'error'
        });
      } else {
        numQubits = qCount;
        numClassicalBits = Math.max(0, Math.min(10, cCount));
        circuitInitialized = true;
        initLineNum = lineNum;
      }
      continue;
    }

    // Parse method calls on qc: e.g. qc.h(0) or qc.cx(0, 1)
    const opMatch = trimmed.match(/^qc\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)\s*;?$/);
    if (opMatch) {
      const method = opMatch[1].toLowerCase();
      const argsStr = opMatch[2].trim();
      rawInstructions.push({
        lineNum,
        method,
        argsStr,
        rawLine
      });
      continue;
    }

    // Unrecognized syntax
    diagnostics.push({
      line: lineNum,
      startColumn: 1,
      endColumn: rawLine.length + 1,
      message: `Syntax error: Unrecognized quantum instruction '${trimmed}'. Expected 'qc.<operation>(...)' or comment.`,
      severity: 'error'
    });
  }

  // If no QuantumCircuit was explicitly defined, notify learner as warning and assume 2 qubits
  if (!circuitInitialized) {
    diagnostics.push({
      line: 1,
      startColumn: 1,
      endColumn: 1,
      message: 'No QuantumCircuit(n) declared. Defaulting to 2 qubits: qc = QuantumCircuit(2)',
      severity: 'info'
    });
  }

  // Pass 2: Instruction parsing and layer scheduling
  const gates: QuantumGate[] = [];
  const measurements: MeasurementMapping[] = [];
  const qubitNextStep: number[] = new Array(numQubits).fill(0);

  for (const item of rawInstructions) {
    const { lineNum, method, argsStr, rawLine } = item;
    const spec = QUANTUM_DSL_OPS[method];

    if (!spec) {
      diagnostics.push({
        line: lineNum,
        startColumn: rawLine.indexOf(method) + 1,
        endColumn: rawLine.indexOf(method) + method.length + 1,
        message: `Unsupported quantum operation 'qc.${method}'. Supported: ${Object.keys(QUANTUM_DSL_OPS).join(', ')}`,
        severity: 'error'
      });
      continue;
    }

    // Parse argument tokens
    const rawTokens = argsStr.length > 0 ? argsStr.split(',').map((s) => s.trim()) : [];

    // Special case: measure_all()
    if (method === 'measure_all') {
      const maxCurrentStep = Math.max(...qubitNextStep, 0);
      for (let q = 0; q < numQubits; q++) {
        const gateId = generateGateId();
        gates.push({
          id: gateId,
          type: 'MEASURE',
          target: q,
          step: maxCurrentStep
        });
        measurements.push({ qubit: q, classical_bit: q });
        qubitNextStep[q] = maxCurrentStep + 1;
        lineToGateId.set(lineNum, gateId);
        gateIdToLine.set(gateId, lineNum);
      }
      continue;
    }

    // Single Qubit Basic & Phase Gates (h, x, y, z, s, t)
    if (['h', 'x', 'y', 'z', 's', 't'].includes(method)) {
      if (rawTokens.length !== 1) {
        diagnostics.push({
          line: lineNum,
          startColumn: 1,
          endColumn: rawLine.length + 1,
          message: `'qc.${method}' requires exactly 1 qubit index argument. Example: qc.${method}(0)`,
          severity: 'error'
        });
        continue;
      }

      const q = parseInt(rawTokens[0], 10);
      if (isNaN(q)) {
        diagnostics.push({
          line: lineNum,
          startColumn: rawLine.indexOf(argsStr) + 1,
          endColumn: rawLine.length + 1,
          message: `Invalid qubit argument '${rawTokens[0]}'. Expected integer index.`,
          severity: 'error'
        });
        continue;
      }

      if (q < 0 || q >= numQubits) {
        diagnostics.push({
          line: lineNum,
          startColumn: rawLine.indexOf(rawTokens[0]) + 1,
          endColumn: rawLine.indexOf(rawTokens[0]) + rawTokens[0].length + 1,
          message: `Qubit index ${q} is out of range for a ${numQubits}-qubit circuit (valid: 0 to ${numQubits - 1}).`,
          severity: 'error'
        });
        continue;
      }

      const step = qubitNextStep[q];
      qubitNextStep[q] = step + 1;

      const gateId = generateGateId();
      gates.push({
        id: gateId,
        type: spec.type,
        target: q,
        step
      });
      lineToGateId.set(lineNum, gateId);
      gateIdToLine.set(gateId, lineNum);
      continue;
    }

    // Two Qubit Gates (cx, cnot, cz, swap)
    if (['cx', 'cnot', 'cz', 'swap'].includes(method)) {
      if (rawTokens.length !== 2) {
        diagnostics.push({
          line: lineNum,
          startColumn: 1,
          endColumn: rawLine.length + 1,
          message: `'qc.${method}' requires 2 qubit arguments (control, target). Example: qc.${method}(0, 1)`,
          severity: 'error'
        });
        continue;
      }

      const q1 = parseInt(rawTokens[0], 10);
      const q2 = parseInt(rawTokens[1], 10);

      if (isNaN(q1) || isNaN(q2)) {
        diagnostics.push({
          line: lineNum,
          startColumn: rawLine.indexOf(argsStr) + 1,
          endColumn: rawLine.length + 1,
          message: `Invalid qubit indices in 'qc.${method}(${argsStr})'. Both arguments must be integers.`,
          severity: 'error'
        });
        continue;
      }

      if (q1 === q2) {
        diagnostics.push({
          line: lineNum,
          startColumn: rawLine.indexOf(argsStr) + 1,
          endColumn: rawLine.length + 1,
          message: `Control and target qubits cannot be identical (q${q1} == q${q2}).`,
          severity: 'error'
        });
        continue;
      }

      if (q1 < 0 || q1 >= numQubits || q2 < 0 || q2 >= numQubits) {
        diagnostics.push({
          line: lineNum,
          startColumn: rawLine.indexOf(argsStr) + 1,
          endColumn: rawLine.length + 1,
          message: `Qubit indices (${q1}, ${q2}) exceed circuit width ${numQubits} (valid: 0 to ${numQubits - 1}).`,
          severity: 'error'
        });
        continue;
      }

      // Schedule at max step of both qubits
      const step = Math.max(qubitNextStep[q1], qubitNextStep[q2]);
      qubitNextStep[q1] = step + 1;
      qubitNextStep[q2] = step + 1;

      const gateId = generateGateId();
      if (method === 'swap') {
        gates.push({
          id: gateId,
          type: 'SWAP',
          targets: [q1, q2],
          step
        });
      } else {
        gates.push({
          id: gateId,
          type: spec.type,
          control: q1,
          target: q2,
          step
        });
      }
      lineToGateId.set(lineNum, gateId);
      gateIdToLine.set(gateId, lineNum);
      continue;
    }

    // Parametric Gates (rx, ry, rz)
    if (['rx', 'ry', 'rz'].includes(method)) {
      if (rawTokens.length !== 2) {
        diagnostics.push({
          line: lineNum,
          startColumn: 1,
          endColumn: rawLine.length + 1,
          message: `'qc.${method}' requires 2 arguments: (theta: float, qubit: int). Example: qc.${method}(3.14, 0)`,
          severity: 'error'
        });
        continue;
      }

      const theta = parseFloat(rawTokens[0]);
      const q = parseInt(rawTokens[1], 10);

      if (isNaN(theta)) {
        diagnostics.push({
          line: lineNum,
          startColumn: rawLine.indexOf(rawTokens[0]) + 1,
          endColumn: rawLine.indexOf(rawTokens[0]) + rawTokens[0].length + 1,
          message: `Angle parameter '${rawTokens[0]}' is not a valid number.`,
          severity: 'error'
        });
        continue;
      }

      if (isNaN(q) || q < 0 || q >= numQubits) {
        diagnostics.push({
          line: lineNum,
          startColumn: rawLine.indexOf(rawTokens[1]) + 1,
          endColumn: rawLine.indexOf(rawTokens[1]) + rawTokens[1].length + 1,
          message: `Qubit index '${rawTokens[1]}' is out of range for a ${numQubits}-qubit circuit.`,
          severity: 'error'
        });
        continue;
      }

      const step = qubitNextStep[q];
      qubitNextStep[q] = step + 1;

      const gateId = generateGateId();
      gates.push({
        id: gateId,
        type: spec.type,
        target: q,
        params: { theta },
        step
      });
      lineToGateId.set(lineNum, gateId);
      gateIdToLine.set(gateId, lineNum);
      continue;
    }

    // Measurement Gate: qc.measure(qubit, cbit)
    if (method === 'measure') {
      if (rawTokens.length < 1 || rawTokens.length > 2) {
        diagnostics.push({
          line: lineNum,
          startColumn: 1,
          endColumn: rawLine.length + 1,
          message: "'qc.measure' requires (qubit: int, cbit: int). Example: qc.measure(0, 0)",
          severity: 'error'
        });
        continue;
      }

      const q = parseInt(rawTokens[0], 10);
      const c = rawTokens[1] !== undefined ? parseInt(rawTokens[1], 10) : q;

      if (isNaN(q) || q < 0 || q >= numQubits) {
        diagnostics.push({
          line: lineNum,
          startColumn: rawLine.indexOf(rawTokens[0]) + 1,
          endColumn: rawLine.indexOf(rawTokens[0]) + rawTokens[0].length + 1,
          message: `Measured qubit index ${q} is out of range.`,
          severity: 'error'
        });
        continue;
      }

      const step = qubitNextStep[q];
      qubitNextStep[q] = step + 1;

      const gateId = generateGateId();
      gates.push({
        id: gateId,
        type: 'MEASURE',
        target: q,
        step
      });
      measurements.push({ qubit: q, classical_bit: c });
      lineToGateId.set(lineNum, gateId);
      gateIdToLine.set(gateId, lineNum);
      continue;
    }
  }

  const hasErrors = diagnostics.some((d) => d.severity === 'error');
  if (hasErrors) {
    return {
      success: false,
      diagnostics,
      lineToGateId,
      gateIdToLine
    };
  }

  const circuit: CanonicalCircuit = {
    schema_version: '1.0.0',
    name: 'Parsed Quantum Circuit',
    description: 'Circuit parsed from Quantum DSL code',
    qubits: numQubits,
    classical_bits: numClassicalBits,
    gates,
    measurements
  };

  const validation = validateCircuit(circuit);
  if (!validation.is_valid) {
    for (const vErr of validation.errors) {
      diagnostics.push({
        line: initLineNum > 0 ? initLineNum : 1,
        startColumn: 1,
        endColumn: 1,
        message: vErr.message,
        severity: 'error'
      });
    }
    return {
      success: false,
      diagnostics,
      lineToGateId,
      gateIdToLine
    };
  }

  return {
    success: true,
    circuit,
    diagnostics,
    lineToGateId,
    gateIdToLine
  };
}
