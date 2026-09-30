/**
 * QUANTUMANIA - Circuit Builder Educational Help Modal
 * Phase 3: Quantum Circuit Builder
 */

import React from 'react';
import { X, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface CircuitHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CircuitHelpModal: React.FC<CircuitHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="circuit-help-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookOpen size={20} color="var(--accent-cyan)" />
            <h2 id="circuit-help-title" style={{ fontSize: '1.15rem' }}>
              How to Build Quantum Circuits
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close dialog"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
              1. Choose a Gate
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Click any gate button in the left <strong>Gate Palette</strong> (e.g. <code>H</code> for Hadamard, <code>X</code> for Pauli-X, or <code>CNOT</code> for Controlled-NOT). The active tool will highlight in cyan.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-purple)', marginBottom: '0.35rem' }}>
              2. Place on a Wire & Time Step
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Click on any cell in the circuit grid. Quantum circuits execute sequentially from left to right across discrete time steps:
              <br />
              • <strong>Single-Qubit Gate (H, X, Y, Z, S, T):</strong> Placed directly on the selected qubit wire.
              <br />
              • <strong>Controlled-NOT (CNOT):</strong> Clicking on a wire places a CNOT gate with an automatic paired control qubit. You can select it and change the control wire in the Inspector panel.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-emerald)', marginBottom: '0.35rem' }}>
              3. Measurement Readout
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Place the <strong>M (Measurement)</strong> operation at the end of your circuit. Measurement collapses the quantum superposition onto classical bits $c_0, c_1$, which Phase 4 will sample to produce probability histograms.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-amber)', marginBottom: '0.35rem' }}>
              4. Editing, Deleting, and Shortcuts
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              • <strong>Select a gate:</strong> Click any placed gate to inspect its matrix or replace it.
              <br />
              • <strong>Delete:</strong> Press <kbd>Delete</kbd> / <kbd>Backspace</kbd> or click the red Delete button.
              <br />
              • <strong>Undo / Redo:</strong> Press <kbd>Ctrl+Z</kbd> to undo and <kbd>Ctrl+Y</kbd> (or <kbd>Ctrl+Shift+Z</kbd>) to redo.
            </p>
          </div>

          <div
            style={{
              padding: '0.85rem',
              backgroundColor: 'rgba(6, 182, 212, 0.08)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--accent-cyan-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Layers size={16} color="var(--accent-cyan)" />
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Phase 4 Simulator Integration Ready
              </strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              The circuit is continuously validated against physical quantum constraints. In Phase 4, Tanishq's simulation engine will consume this circuit to calculate statevectors, Bloch sphere angles, and shot distributions.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
          <button type="button" onClick={onClose} className="btn btn-primary">
            <CheckCircle2 size={16} />
            <span>Got it, let&apos;s build!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
