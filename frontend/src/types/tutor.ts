/**
 * QUANTUMANIA - AI Quantum Tutor TypeScript Types
 * Phase 5: AI Quantum Tutor
 * Conforms to backend/app/schemas/tutor.py
 */

import { CanonicalCircuit } from './circuit';


export type TutorMode = 'explain' | 'hint' | 'ask' | 'guide' | 'analyze';
export type TutorRole = 'user' | 'assistant' | 'system';

export interface TutorMessage {
  id: string;
  role: TutorRole;
  content: string;
  timestamp: string;
  mode?: TutorMode;
  keyPoints?: string[];
  nextStep?: string;
  followUpQuestion?: string;
  contextUsed?: Record<string, any>;
}

export interface LessonContext {
  lesson_id?: string;
  title?: string;
  topic?: string;
  objectives?: string[];
  difficulty?: string;
}

export interface CircuitContext {
  qubits: number;
  depth: number;
  gate_count: number;
  gates_summary: string[];
  circuit?: CanonicalCircuit;
}

export interface SimulationContext {
  has_simulation: boolean;
  is_stale: boolean;
  shots?: number;
  probabilities?: Record<string, number>;
  counts?: Record<string, number>;
  bloch_vectors?: any[];
}

export interface TutorRequest {
  mode: TutorMode;
  message?: string;
  hint_level?: number;
  lesson_context?: LessonContext;
  circuit_context?: CircuitContext;
  simulation_context?: SimulationContext;
  conversation?: Array<{ role: TutorRole; content: string }>;
}

export interface TutorResponse {
  message: string;
  mode: TutorMode;
  key_points?: string[];
  next_step?: string;
  follow_up_question?: string;
  context_used?: Record<string, any>;
}

export interface TutorStatus {
  status: string;
  active_provider: string;
  has_external_api_key: boolean;
  supported_modes: TutorMode[];
  max_conversation_history: number;
  grounding_sources: string[];
}
