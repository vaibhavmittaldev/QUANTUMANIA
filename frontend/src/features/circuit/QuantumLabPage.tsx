/**
 * QUANTUMANIA - Quantum Lab & Circuit Builder Page
 * Phase 3: Quantum Circuit Builder
 * Integration destination for Tanishq's quantum track.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircuitProvider, useCircuit } from './context/CircuitContext';
import { GatePalette } from './components/GatePalette';
import { CircuitWorkspace } from './components/CircuitWorkspace';
import { CircuitInspector } from './components/CircuitInspector';
import { CircuitCodeModal } from './components/CircuitCodeModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { CircuitHelpModal } from './components/CircuitHelpModal';
import { SimulationResultsPanel } from './components/SimulationResultsPanel';
import { CIRCUIT_TEMPLATES } from './domain/circuitTemplates';
import { simulateCircuit } from './simulator/quantumSimulator';
import { SimulationResult } from '../../types/circuit';
import {
  Undo2,
  Redo2,
  RotateCcw,
  Code,
  Play,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';


const QuantumLabInner: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    circuit,
    setCircuitName,
    canUndo,
    canRedo,
    undo,
    redo,
    resetCircuit,
    loadTemplate,
    validation,
    feedbackMessage,
    setFeedbackMessage
  } = useCircuit();

  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Phase 4: Quantum Simulation State
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [shots, setShots] = useState(1024);
  const [lastSimulatedSignature, setLastSimulatedSignature] = useState<string | null>(null);

  // Detect stale results when circuit is modified
  const currentCircuitSignature = JSON.stringify(circuit.gates);
  const isStale =
    simulationResult !== null &&
    lastSimulatedSignature !== null &&
    lastSimulatedSignature !== currentCircuitSignature;

  // Handle deep-link query parameter from Phase 2 Lessons (e.g. ?template=bell-state)
  useEffect(() => {
    const templateQuery = searchParams.get('template');
    if (templateQuery) {
      const success = loadTemplate(templateQuery);
      if (success) {
        setSelectedTemplateId(templateQuery);
      }
    }
  }, [searchParams, loadTemplate]);

  // Auto-dismiss feedback message after 3.5 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage, setFeedbackMessage]);

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplateId(val);
    if (val) {
      loadTemplate(val);
    }
  };

  const handleConfirmReset = () => {
    resetCircuit();
    setSimulationResult(null);
    setLastSimulatedSignature(null);
    setIsResetModalOpen(false);
  };

  const handleRunSimulation = () => {
    if (!validation.is_valid) {
      setFeedbackMessage({
        type: 'error',
        text: validation.errors[0]?.message || 'Cannot run circuit. Please fix validation errors.'
      });
      return;
    }

    setIsSimulating(true);
    try {
      const result = simulateCircuit(circuit, { shots });
      setSimulationResult(result);
      setLastSimulatedSignature(JSON.stringify(circuit.gates));

      if (result.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Simulation complete: ${result.shots} shots in ${result.execution_time_ms} ms`
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: result.error || 'Simulation failed.'
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected simulation failure.';
      setFeedbackMessage({
        type: 'error',
        text: message
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClearResults = () => {
    setSimulationResult(null);
    setLastSimulatedSignature(null);
    setFeedbackMessage({
      type: 'info',
      text: 'Simulation results cleared.'
    });
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: 'calc(100vh - 120px)' }}>
      {/* Workbench Header Toolbar */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(20, 16, 40, 0.85) 100%)',
          border: '1px solid var(--border-medium)'
        }}
      >
        {/* Left: Circuit Name input and badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
              Phase 3 Circuit Builder
            </span>
            {validation.is_valid ? (
              <span className="badge badge-emerald" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={12} /> Valid
              </span>
            ) : (
              <span className="badge badge-rose" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangle size={12} /> Has Issues
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="text"
              value={circuit.name || ''}
              onChange={(e) => setCircuitName(e.target.value)}
              placeholder="Circuit Name"
              aria-label="Circuit Name"
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.3rem 0.6rem',
                minWidth: '220px'
              }}
            />
          </div>
        </div>

        {/* Right: Actions Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Template Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Bookmark size={15} color="var(--accent-purple)" />
            <select
              value={selectedTemplateId}
              onChange={handleTemplateSelect}
              aria-label="Select circuit template"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                padding: '0.4rem 0.6rem',
                cursor: 'pointer'
              }}
            >
              <option value="">Load Template...</option>
              {CIRCUIT_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Undo / Redo */}
          <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '0.5rem', marginLeft: '0.25rem' }}>
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="btn btn-secondary"
              title="Undo (Ctrl+Z)"
              aria-label="Undo circuit change"
              style={{ padding: '0.4rem 0.6rem', opacity: canUndo ? 1 : 0.4 }}
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="btn btn-secondary"
              title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
              aria-label="Redo circuit change"
              style={{ padding: '0.4rem 0.6rem', opacity: canRedo ? 1 : 0.4, marginLeft: '0.25rem' }}
            >
              <Redo2 size={15} />
            </button>
          </div>

          {/* Reset / Clear */}
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="btn btn-secondary"
            title="Reset circuit canvas"
            aria-label="Reset circuit canvas"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>

          {/* JSON View */}
          <button
            type="button"
            onClick={() => setIsCodeModalOpen(true)}
            className="btn btn-secondary"
            title="View or import canonical JSON"
            aria-label="View or import circuit JSON"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          >
            <Code size={15} />
            <span>Circuit JSON</span>
          </button>

          {/* Shots Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.25rem' }}>
            <label htmlFor="shots-select" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Shots:
            </label>
            <select
              id="shots-select"
              aria-label="Simulation measurement shots"
              value={shots}
              onChange={(e) => setShots(Number(e.target.value))}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                padding: '0.35rem 0.5rem',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={100}>100</option>
              <option value={1000}>1,000</option>
              <option value={1024}>1,024</option>
              <option value={4096}>4,096</option>
            </select>
          </div>

          {/* Active Phase 4 Run Circuit Button */}
          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="btn btn-primary"
            title="Execute state-vector quantum simulation"
            aria-label="Run Quantum Circuit Simulation"
            style={{
              padding: '0.45rem 1.05rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
              cursor: isSimulating ? 'wait' : 'pointer'
            }}
          >
            {isSimulating ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" />
                <span>Run Circuit</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Ephemeral Feedback Toast */}
      {feedbackMessage && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            backgroundColor:
              feedbackMessage.type === 'success'
                ? 'rgba(16, 185, 129, 0.15)'
                : feedbackMessage.type === 'error'
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(6, 182, 212, 0.15)',
            border: `1px solid ${
              feedbackMessage.type === 'success'
                ? 'rgba(16, 185, 129, 0.4)'
                : feedbackMessage.type === 'error'
                ? 'rgba(239, 68, 68, 0.4)'
                : 'rgba(6, 182, 212, 0.4)'
            }`,
            color:
              feedbackMessage.type === 'success'
                ? 'var(--accent-emerald)'
                : feedbackMessage.type === 'error'
                ? 'var(--accent-rose)'
                : 'var(--accent-cyan)',
            transition: 'all 0.2s ease'
          }}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : feedbackMessage.type === 'error' ? (
            <AlertTriangle size={16} />
          ) : (
            <Info size={16} />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Main Workbench Grid (Palette | Canvas | Inspector) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 260px) minmax(480px, 1fr) minmax(240px, 310px)',
          gap: '1.25rem',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Gate Palette */}
        <div>
          <GatePalette onOpenHelp={() => setIsHelpModalOpen(true)} />
        </div>

        {/* Center Column: Interactive Circuit Canvas */}
        <div>
          <CircuitWorkspace />
        </div>

        {/* Right Column: Inspector & Validation */}
        <div>
          <CircuitInspector />
        </div>
      </div>

      {/* Phase 4: Classical Quantum Simulation Results */}
      <SimulationResultsPanel
        result={simulationResult}
        isStale={isStale}
        onClear={handleClearResults}
        onRerun={handleRunSimulation}
      />

      {/* Modals */}
      <CircuitCodeModal

        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <CircuitHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};

export const QuantumLabPage: React.FC = () => {
  return (
    <CircuitProvider>
      <QuantumLabInner />
    </CircuitProvider>
  );
};
