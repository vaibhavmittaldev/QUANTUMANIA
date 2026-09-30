/**
 * QUANTUMANIA - Canonical Quantum Circuit TypeScript Types
 * Phase 3: Quantum Circuit Builder
 * Conforms to docs/QUANTUM_SCHEMA.md (Schema Version: 1.0.0)
 */

export type GateType =
  | 'X'
  | 'Y'
  | 'Z'
  | 'H'
  | 'S'
  | 'T'
  | 'CNOT'
  | 'MEASURE'
  | 'SWAP'
  | 'CZ'
  | 'RX'
  | 'RY'
  | 'RZ';

export type GateCategory = 'basic' | 'phase' | 'controlled' | 'measurement' | 'parametric';

export interface GateParams {
  theta?: number;
  phi?: number;
  lambda?: number;
}

export interface QuantumGate {
  id: string;
  type: GateType;
  target?: number;
  targets?: number[];
  control?: number;
  controls?: number[];
  step: number;
  params?: GateParams;
}

export interface MeasurementMapping {
  qubit: number;
  classical_bit: number;
}

export interface CanonicalCircuit {
  schema_version: '1.0.0';
  id?: string;
  name?: string;
  description?: string;
  qubits: number;
  classical_bits: number;
  gates: QuantumGate[];
  measurements?: MeasurementMapping[];
}

export interface GateDefinition {
  type: GateType;
  symbol: string;
  name: string;
  category: GateCategory;
  description: string;
  qubitsRequired: number;
  matrixPreview: string;
  accessibleLabel: string;
  badgeColor: string;
}

export interface CircuitValidationError {
  gate_id?: string;
  gate_index?: number;
  gate_type?: string;
  message: string;
  violation: string;
}

export interface CircuitValidationResult {
  is_valid: boolean;
  errors: CircuitValidationError[];
  warnings: string[];
  depth: number;
  gate_count: number;
  qubits: number;
  classical_bits: number;
}

export interface CircuitTemplate {
  id: string;
  name: string;
  description: string;
  qubits: number;
  gate_count: number;
  circuit: CanonicalCircuit;
}
