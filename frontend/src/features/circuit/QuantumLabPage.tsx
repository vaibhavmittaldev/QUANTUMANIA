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
import { CIRCUIT_TEMPLATES } from './domain/circuitTemplates';
import {
  Undo2,
  Redo2,
  RotateCcw,
  Code,
  Play,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Info
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
    setIsResetModalOpen(false);
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

          {/* Phase 4 Execution Handoff Button (Disabled with honest educational tooltip) */}
          <div
            title="Quantum simulation engine will be available in Phase 4 (Tanishq track). Circuit is currently validated and ready for simulation."
            style={{ display: 'inline-block' }}
          >
            <button
              type="button"
              disabled
              className="btn btn-primary"
              style={{
                opacity: 0.6,
                cursor: 'not-allowed',
                padding: '0.4rem 0.9rem',
                fontSize: '0.85rem'
              }}
            >
              <Play size={15} />
              <span>Simulate (Phase 4)</span>
            </button>
          </div>
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
