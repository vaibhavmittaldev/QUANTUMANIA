/**
 * QUANTUMANIA - Circuit Inspector & Validation Panel
 * Phase 3: Quantum Circuit Builder
 */

import React from 'react';
import { useCircuit } from '../context/CircuitContext';
import { GATE_REGISTRY } from '../domain/gateRegistry';
import { GateType } from '../../../types/circuit';
import { Trash2, AlertTriangle, CheckCircle2, Sliders, Layers, Clock, Cpu } from 'lucide-react';

export const CircuitInspector: React.FC = () => {
  const {
    circuit,
    selectedGate,
    validation,
    deleteSelectedGate,
    replaceSelectedGate,
    selectGate
  } = useCircuit();

  const replacableGates: GateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T'];

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.25rem',
        width: '100%'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          {selectedGate ? 'Operation Inspector' : 'Circuit Status & Metrics'}
        </h2>
        {selectedGate && (
          <button
            type="button"
            onClick={() => selectGate(null)}
            className="btn btn-secondary"
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Selected Gate Inspection */}
      {selectedGate ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: `2px solid ${GATE_REGISTRY[selectedGate.type]?.badgeColor || 'var(--accent-cyan)'}`,
                  color: GATE_REGISTRY[selectedGate.type]?.badgeColor || 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                {selectedGate.type === 'CNOT' ? 'CX' : GATE_REGISTRY[selectedGate.type]?.symbol || selectedGate.type}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {GATE_REGISTRY[selectedGate.type]?.name || selectedGate.type}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Time column t{selectedGate.step}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={deleteSelectedGate}
              className="btn btn-secondary"
              title="Delete this operation"
              aria-label="Delete gate"
              style={{
                color: 'var(--accent-rose)',
                borderColor: 'rgba(244, 63, 94, 0.3)',
                padding: '0.4rem 0.6rem'
              }}
            >
              <Trash2 size={14} />
              <span style={{ fontSize: '0.75rem' }}>Delete</span>
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {GATE_REGISTRY[selectedGate.type]?.description}
          </p>

          {/* Operation Wiring Parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
            {selectedGate.type === 'CNOT' ? (
              <>
                <div style={{ padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Control Qubit</span>
                  <strong style={{ color: 'var(--accent-purple)' }}>q{selectedGate.control}</strong>
                </div>
                <div style={{ padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Target Qubit</span>
                  <strong style={{ color: 'var(--accent-purple)' }}>q{selectedGate.target}</strong>
                </div>
              </>
            ) : (
              <div style={{ gridColumn: 'span 2', padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Target Wire</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>q{selectedGate.target}</strong>
              </div>
            )}
          </div>

          {/* Replace Single Qubit Gate quick buttons */}
          {selectedGate.type !== 'CNOT' && selectedGate.type !== 'MEASURE' && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Replace With
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {replacableGates
                  .filter((gt) => gt !== selectedGate.type)
                  .map((gt) => (
                    <button
                      key={`replace-${gt}`}
                      type="button"
                      onClick={() => replaceSelectedGate(gt)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    >
                      {gt}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Circuit Summary Metrics when no gate is selected */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Cpu size={14} color="var(--accent-cyan)" />
              <span>Qubits</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
              {circuit.qubits}
            </div>
          </div>

          <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Clock size={14} color="var(--accent-purple)" />
              <span>Depth</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
              {validation.depth}
            </div>
          </div>

          <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Layers size={14} color="var(--accent-amber)" />
              <span>Gate Count</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
              {circuit.gates.length}
            </div>
          </div>

          <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Sliders size={14} color="var(--accent-emerald)" />
              <span>Classical Bits</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
              {circuit.classical_bits}
            </div>
          </div>
        </div>
      )}

      {/* Live Validation Status Card */}
      <div
        style={{
          marginTop: 'auto',
          padding: '0.85rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: validation.is_valid
            ? 'rgba(16, 185, 129, 0.08)'
            : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${
            validation.is_valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
          }`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          {validation.is_valid ? (
            <>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <strong style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>
                Circuit Valid & Ready for Phase 4
              </strong>
            </>
          ) : (
            <>
              <AlertTriangle size={16} color="var(--accent-rose)" />
              <strong style={{ fontSize: '0.85rem', color: 'var(--accent-rose)' }}>
                Validation Error ({validation.errors.length})
              </strong>
            </>
          )}
        </div>

        {validation.is_valid ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
            All operations obey unitary matrix constraints, control-target distinctness, and collision-free timeline slicing.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.3rem' }}>
            {validation.errors.slice(0, 3).map((err, idx) => (
              <div key={idx} style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                • {err.message}
              </div>
            ))}
          </div>
        )}

        {/* Warning messages */}
        {validation.warnings.length > 0 && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--accent-amber)' }}>
            ⚠️ {validation.warnings[0]}
          </div>
        )}
      </div>
    </div>
  );
};
