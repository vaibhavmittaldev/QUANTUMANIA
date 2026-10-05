/**
 * QUANTUMANIA - Canonical Quantum Circuit TypeScript Types
 * Unified interface supporting Phase 3 & 4 Quantum Builder & QuantumLab fidelity.
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

export interface ComplexNumber {
  re: number;
  im: number;
}

export interface GateParams {
  theta?: number | string;
  phi?: number | string;
  lambda?: number | string;
}

export interface QuantumGate {
  id: string;
  type: GateType;
  target?: number;
  targets?: number[];
  control?: number;
  controls?: number[];
  step: number;
  column?: number;
  params?: GateParams;
  parameters?: Record<string, any>;
}

export interface MeasurementMapping {
  qubit: number;
  classical_bit: number;
}

export interface CanonicalCircuit {
  schema_version?: '1.0.0';
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  qubits: number;
  numQubits?: number;
  classical_bits: number;
  numClassicalBits?: number;
  depth?: number;
  gates: QuantumGate[];
  operations?: QuantumGate[];
  measurements?: MeasurementMapping[];
  metadata?: Record<string, any>;
}

export interface GateDefinition {
  type?: GateType;
  symbol: string;
  displaySymbol?: string;
  name: string;
  category: string;
  description: string;
  qubitsRequired?: number;
  matrixPreview?: string;
  accessibleLabel?: string;
  badgeColor?: string;
  colorClass?: string;
  bgClass?: string;
  borderClass?: string;
  defaultParam?: string;
  aliases?: string[];
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

export interface BackendInfo {
  id: string;
  framework: string;
  mode: string;
  version?: string;
}

export interface NoiseConfig {
  enabled: boolean;
  model?: string;
  errorRate?: number;
}

export interface SimulationOptions {
  shots?: number;
  backend?: string;
  framework?: string;
  mode?: string;
  noise?: NoiseConfig;
  stepIndex?: number;
  seed?: number;
  rng?: () => number;
  tolerance?: number;
}

export interface SimulationResult {
  success: boolean;
  circuit_id?: string;
  circuitId?: string;
  qubits: number;
  numQubits?: number;
  depth: number;
  operationCount: number;
  shots: number;
  counts: Record<string, number>;
  measurementCounts?: Record<string, number>;
  probabilities: Record<string, number>;
  statevector: StatevectorEntry[];
  bloch_vectors?: BlochVector[];
  execution_time_ms: number;
  executionTimeMs?: number;
  backend?: BackendInfo;
  currentStep?: number;
  current_step?: number;
  noise?: NoiseConfig;
  explanation?: string;
  error?: string;
}

export interface CompareResult {
  backends_tested: string[];
  results: Record<string, any>;
  consistent: boolean;
  discrepancies: string[];
  tolerance_used: number;
}

export interface SavedCircuit {
  id: string;
  title: string;
  qubits: number;
  numQubits?: number;
  classical_bits: number;
  numClassicalBits?: number;
  canonical: CanonicalCircuit;
  qiskit_code?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveCircuitResponse {
  success: boolean;
  circuit_id: string;
  message: string;
}

export interface OpenQASMExportResponse {
  qasm: string;
  qubits: number;
  depth: number;
}

export interface CircuitTemplate {
  id: string;
  name: string;
  description: string;
  qubits: number;
  gate_count: number;
  circuit: CanonicalCircuit;
}

