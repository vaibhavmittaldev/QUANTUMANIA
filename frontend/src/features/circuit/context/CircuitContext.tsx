/**
 * QUANTUMANIA - Circuit Builder State Management (Context)
 * Phase 3: Quantum Circuit Builder
 * Provides single source of truth, immutable transitions, and undo/redo history.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  CanonicalCircuit,
  QuantumGate,
  GateType,
  CircuitValidationResult
} from '../../../types/circuit';
import {
  createEmptyCircuit,
  validateCircuit,
  addGate,
  removeGate,
  updateGate,
  moveGate as domainMoveGate,
  setQubitCount as domainSetQubits,
  cloneCircuit
} from '../domain/circuitDomain';
import { getTemplateById } from '../domain/circuitTemplates';

interface CircuitContextType {
  circuit: CanonicalCircuit;
  selectedGateId: string | null;
  selectedGate: QuantumGate | null;
  activeTool: GateType | 'SELECT' | 'DELETE' | null;
  validation: CircuitValidationResult;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  selectGate: (gateId: string | null) => void;
  setActiveTool: (tool: GateType | 'SELECT' | 'DELETE' | null) => void;
  placeGateAt: (step: number, target: number, control?: number, specificType?: GateType) => { success: boolean; error?: string };
  moveGate: (gateId: string, toStep: number, toTarget: number) => { success: boolean; error?: string };
  deleteSelectedGate: () => void;
  deleteGateById: (gateId: string) => void;
  replaceSelectedGate: (newType: GateType) => { success: boolean; error?: string };
  updateGateParam: (gateId: string, paramKey: string, value: any) => { success: boolean; error?: string };
  setQubits: (count: number) => { success: boolean; error?: string };
  setCircuitName: (name: string) => void;
  resetCircuit: () => void;
  clearGates: () => void;
  loadTemplate: (templateId: string) => boolean;
  loadCircuit: (circuit: CanonicalCircuit, source?: 'visual' | 'code') => boolean;
  feedbackMessage: { type: 'success' | 'error' | 'info'; text: string } | null;
  setFeedbackMessage: (msg: { type: 'success' | 'error' | 'info'; text: string } | null) => void;
  // Drag & drop visual interaction state
  hoveredCell: { step: number; qubit: number } | null;
  setHoveredCell: (cell: { step: number; qubit: number } | null) => void;
  // Bidirectional highlighting state between Monaco and visual circuit
  highlightedGateId: string | null;
  setHighlightedGateId: (id: string | null) => void;
  highlightedLineNumber: number | null;
  setHighlightedLineNumber: (line: number | null) => void;
  circuitSource: 'visual' | 'code';
}

const CircuitContext = createContext<CircuitContextType | undefined>(undefined);

export const CircuitProvider: React.FC<{
  initialCircuit?: CanonicalCircuit;
  children: React.ReactNode;
}> = ({ initialCircuit, children }) => {
  const [circuit, setCircuit] = useState<CanonicalCircuit>(() => {
    return initialCircuit ? cloneCircuit(initialCircuit) : createEmptyCircuit(2, 2);
  });

  const [history, setHistory] = useState<CanonicalCircuit[]>([]);
  const [future, setFuture] = useState<CanonicalCircuit[]>([]);
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<GateType | 'SELECT' | 'DELETE' | null>('H');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Drag & drop visual interaction state
  const [hoveredCell, setHoveredCell] = useState<{ step: number; qubit: number } | null>(null);

  // Bidirectional highlighting state between Monaco and visual circuit
  const [highlightedGateId, setHighlightedGateId] = useState<string | null>(null);
  const [highlightedLineNumber, setHighlightedLineNumber] = useState<number | null>(null);
  const [circuitSource, setCircuitSource] = useState<'visual' | 'code'>('visual');

  // Derived validation result
  const validation = useMemo(() => validateCircuit(circuit), [circuit]);

  // Derived selected gate
  const selectedGate = useMemo(() => {
    if (!selectedGateId) return null;
    return circuit.gates.find((g) => g.id === selectedGateId) || null;
  }, [circuit.gates, selectedGateId]);

  // Helper to commit new state with undo record
  const pushState = useCallback((nextCircuit: CanonicalCircuit, source: 'visual' | 'code' = 'visual') => {
    setHistory((prev) => [...prev.slice(-30), cloneCircuit(circuit)]);
    setFuture([]);
    setCircuitSource(source);
    setCircuit(nextCircuit);
  }, [circuit]);

  // Undo action
  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [cloneCircuit(circuit), ...f]);
    setCircuitSource('visual');
    setCircuit(cloneCircuit(prev));
    setSelectedGateId(null);
  }, [history, circuit]);

  // Redo action
  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, cloneCircuit(circuit)]);
    setCircuitSource('visual');
    setCircuit(cloneCircuit(next));
    setSelectedGateId(null);
  }, [future, circuit]);

  // Keyboard shortcut listener for Undo (Ctrl+Z) / Redo (Ctrl+Y or Ctrl+Shift+Z) and Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea / monaco editor
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.closest('.monaco-editor')) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedGateId) {
          e.preventDefault();
          const next = removeGate(circuit, selectedGateId);
          pushState(next, 'visual');
          setSelectedGateId(null);
          setFeedbackMessage({ type: 'info', text: 'Operation removed from circuit.' });
        }
      } else if (e.key === 'Escape') {
        setSelectedGateId(null);
        setActiveTool('SELECT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedGateId, circuit, pushState]);

  // Gate selection
  const selectGate = useCallback((gateId: string | null) => {
    setSelectedGateId(gateId);
    setHighlightedGateId(gateId);
  }, []);

  // Place gate using active tool or explicitly specified gate type
  const placeGateAt = useCallback(
    (step: number, target: number, control?: number, specificType?: GateType): { success: boolean; error?: string } => {
      const toolToUse = specificType || activeTool;
      if (!toolToUse || toolToUse === 'SELECT') {
        return { success: false, error: 'Select a gate from the palette first.' };
      }

      if (toolToUse === 'DELETE') {
        // Find gate at step and target
        const gate = circuit.gates.find(
          (g) => g.step === step && (g.target === target || (g.targets && g.targets.includes(target)))
        );
        if (gate) {
          const next = removeGate(circuit, gate.id);
          pushState(next, 'visual');
          setSelectedGateId(null);
          return { success: true };
        }
        return { success: false };
      }

      const gateType = toolToUse as GateType;

      // Handle CNOT
      if (gateType === 'CNOT') {
        const ctrl = control !== undefined ? control : target === 0 ? 1 : 0;
        if (ctrl === target) {
          const err = 'CNOT requires two distinct qubits: control and target cannot be identical.';
          setFeedbackMessage({ type: 'error', text: err });
          return { success: false, error: err };
        }

        const res = addGate(circuit, {
          type: 'CNOT',
          control: ctrl,
          target: target,
          step
        });

        if (res.error) {
          setFeedbackMessage({ type: 'error', text: res.error });
          return { success: false, error: res.error };
        }

        pushState(res.circuit, 'visual');
        setFeedbackMessage({ type: 'success', text: `Placed CNOT (q${ctrl} → q${target}) at step ${step}.` });
        return { success: true };
      }

      // Handle CZ
      if (gateType === 'CZ') {
        const ctrl = control !== undefined ? control : target === 0 ? 1 : 0;
        if (ctrl === target) {
          const err = 'CZ requires two distinct qubits: control and target cannot be identical.';
          setFeedbackMessage({ type: 'error', text: err });
          return { success: false, error: err };
        }

        const res = addGate(circuit, {
          type: 'CZ',
          control: ctrl,
          target: target,
          step
        });

        if (res.error) {
          setFeedbackMessage({ type: 'error', text: res.error });
          return { success: false, error: res.error };
        }

        pushState(res.circuit, 'visual');
        setFeedbackMessage({ type: 'success', text: `Placed CZ (q${ctrl} → q${target}) at step ${step}.` });
        return { success: true };
      }

      // Handle SWAP
      if (gateType === 'SWAP') {
        const other = control !== undefined ? control : target === 0 ? 1 : 0;
        if (other === target) {
          const err = 'SWAP requires two distinct qubits.';
          setFeedbackMessage({ type: 'error', text: err });
          return { success: false, error: err };
        }

        const res = addGate(circuit, {
          type: 'SWAP',
          targets: [target, other],
          target: target,
          step
        });

        if (res.error) {
          setFeedbackMessage({ type: 'error', text: res.error });
          return { success: false, error: res.error };
        }

        pushState(res.circuit, 'visual');
        setFeedbackMessage({ type: 'success', text: `Placed SWAP (q${target} ↔ q${other}) at step ${step}.` });
        return { success: true };
      }

      // Handle single-qubit gates, rotations & measurement
      const isRotation = ['RX', 'RY', 'RZ'].includes(gateType);
      const res = addGate(circuit, {
        type: gateType,
        target: target,
        step,
        params: isRotation ? { theta: Math.PI / 2 } : undefined,
        parameters: isRotation ? { theta: 'pi/2' } : undefined
      });

      if (res.error) {
        setFeedbackMessage({ type: 'error', text: res.error });
        return { success: false, error: res.error };
      }

      pushState(res.circuit, 'visual');
      setFeedbackMessage({ type: 'success', text: `Placed ${gateType} on q${target} at step ${step}.` });
      return { success: true };
    },
    [activeTool, circuit, pushState]
  );

  // Move existing gate to a new grid position
  const moveGate = useCallback(
    (gateId: string, toStep: number, toTarget: number): { success: boolean; error?: string } => {
      const res = domainMoveGate(circuit, gateId, toStep, toTarget);
      if (res.error) {
        setFeedbackMessage({ type: 'error', text: res.error });
        return { success: false, error: res.error };
      }
      pushState(res.circuit, 'visual');
      setSelectedGateId(gateId);
      setHighlightedGateId(gateId);
      setFeedbackMessage({ type: 'success', text: `Moved operation to step ${toStep}, qubit ${toTarget}.` });
      return { success: true };
    },
    [circuit, pushState]
  );

  // Delete selected gate
  const deleteSelectedGate = useCallback(() => {
    if (!selectedGateId) return;
    const next = removeGate(circuit, selectedGateId);
    pushState(next);
    setSelectedGateId(null);
    setFeedbackMessage({ type: 'info', text: 'Operation removed.' });
  }, [selectedGateId, circuit, pushState]);

  // Delete gate by ID
  const deleteGateById = useCallback(
    (gateId: string) => {
      const next = removeGate(circuit, gateId);
      pushState(next);
      if (selectedGateId === gateId) setSelectedGateId(null);
      setFeedbackMessage({ type: 'info', text: 'Operation removed.' });
    },
    [circuit, pushState, selectedGateId]
  );

  // Replace selected gate
  const replaceSelectedGate = useCallback(
    (newType: GateType): { success: boolean; error?: string } => {
      if (!selectedGate) {
        return { success: false, error: 'No gate currently selected.' };
      }

      if (selectedGate.type === 'CNOT' && newType !== 'CNOT') {
        const err = 'Cannot replace multi-qubit CNOT directly with a single-qubit gate. Delete and place new gate.';
        setFeedbackMessage({ type: 'error', text: err });
        return { success: false, error: err };
      }

      if (newType === 'CNOT' && selectedGate.type !== 'CNOT') {
        const ctrl = selectedGate.target === 0 ? 1 : 0;
        const res = updateGate(circuit, selectedGate.id, {
          type: 'CNOT',
          control: ctrl,
          target: selectedGate.target
        });
        if (res.error) {
          setFeedbackMessage({ type: 'error', text: res.error });
          return { success: false, error: res.error };
        }
        pushState(res.circuit);
        setFeedbackMessage({ type: 'success', text: `Replaced with CNOT.` });
        return { success: true };
      }

      const res = updateGate(circuit, selectedGate.id, {
        type: newType
      });

      if (res.error) {
        setFeedbackMessage({ type: 'error', text: res.error });
        return { success: false, error: res.error };
      }

      pushState(res.circuit);
      setFeedbackMessage({ type: 'success', text: `Replaced with ${newType}.` });
      return { success: true };
    },
    [selectedGate, circuit, pushState]
  );

  // Update gate parameter (e.g. theta for rotation gates)
  const updateGateParam = useCallback(
    (gateId: string, paramKey: string, value: any): { success: boolean; error?: string } => {
      const g = circuit.gates.find((gate) => gate.id === gateId);
      if (!g) return { success: false, error: 'Gate not found' };
      const currentParams = g.params || {};
      const res = updateGate(circuit, gateId, {
        params: { ...currentParams, [paramKey]: value },
        parameters: { ...(g.parameters || {}), [paramKey]: value }
      });
      if (res.error) {
        setFeedbackMessage({ type: 'error', text: res.error });
        return { success: false, error: res.error };
      }
      pushState(res.circuit);
      return { success: true };
    },
    [circuit, pushState]
  );

  // Change qubit count
  const setQubits = useCallback(
    (count: number): { success: boolean; error?: string } => {
      const res = domainSetQubits(circuit, count);
      if (res.error) {
        setFeedbackMessage({ type: 'error', text: res.error });
        return { success: false, error: res.error };
      }
      pushState(res.circuit);
      setSelectedGateId(null);
      setFeedbackMessage({ type: 'info', text: `Qubit count set to ${count}.` });
      return { success: true };
    },
    [circuit, pushState]
  );

  // Set circuit title
  const setCircuitName = useCallback((name: string) => {
    setCircuit((prev) => ({
      ...prev,
      name: name.trim() || 'Untitled Circuit'
    }));
  }, []);

  // Reset circuit to clean empty 2-qubit canvas
  const resetCircuit = useCallback(() => {
    const empty = createEmptyCircuit(2, 2);
    pushState(empty);
    setSelectedGateId(null);
    setFeedbackMessage({ type: 'info', text: 'Circuit reset to initial empty state.' });
  }, [pushState]);

  // Clear all gates but preserve qubit count
  const clearGates = useCallback(() => {
    const next: CanonicalCircuit = {
      ...circuit,
      gates: [],
      measurements: []
    };
    pushState(next);
    setSelectedGateId(null);
    setFeedbackMessage({ type: 'info', text: 'All gates removed.' });
  }, [circuit, pushState]);

  // Load a starter template
  const loadTemplate = useCallback(
    (templateId: string): boolean => {
      const tpl = getTemplateById(templateId);
      if (!tpl) {
        setFeedbackMessage({ type: 'error', text: `Template '${templateId}' not found.` });
        return false;
      }
      pushState(cloneCircuit(tpl.circuit));
      setSelectedGateId(null);
      setFeedbackMessage({ type: 'success', text: `Loaded template: ${tpl.name}` });
      return true;
    },
    [pushState]
  );

  // Load an arbitrary canonical circuit object
  const loadCircuit = useCallback(
    (newCircuit: CanonicalCircuit, source: 'visual' | 'code' = 'visual'): boolean => {
      const check = validateCircuit(newCircuit);
      if (!check.is_valid) {
        setFeedbackMessage({
          type: 'error',
          text: `Cannot load circuit: ${check.errors[0]?.message || 'Invalid circuit schema'}`
        });
        return false;
      }
      pushState(cloneCircuit(newCircuit), source);
      setSelectedGateId(null);
      setFeedbackMessage({ type: 'success', text: 'Circuit loaded successfully.' });
      return true;
    },
    [pushState]
  );

  return (
    <CircuitContext.Provider
      value={{
        circuit,
        selectedGateId,
        selectedGate,
        activeTool,
        validation,
        canUndo: history.length > 0,
        canRedo: future.length > 0,
        undo,
        redo,
        selectGate,
        setActiveTool,
        placeGateAt,
        moveGate,
        deleteSelectedGate,
        deleteGateById,
        replaceSelectedGate,
        updateGateParam,
        setQubits,
        setCircuitName,
        resetCircuit,
        clearGates,
        loadTemplate,
        loadCircuit,
        feedbackMessage,
        setFeedbackMessage,
        hoveredCell,
        setHoveredCell,
        highlightedGateId,
        setHighlightedGateId,
        highlightedLineNumber,
        setHighlightedLineNumber,
        circuitSource
      }}
    >
      {children}
    </CircuitContext.Provider>
  );
};

export const useCircuit = (): CircuitContextType => {
  const context = useContext(CircuitContext);
  if (!context) {
    throw new Error('useCircuit must be used within a CircuitProvider');
  }
  return context;
};
