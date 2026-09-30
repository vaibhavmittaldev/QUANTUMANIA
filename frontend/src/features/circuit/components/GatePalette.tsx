/**
 * QUANTUMANIA - Gate Palette Component
 * Phase 3: Quantum Circuit Builder
 */

import React from 'react';
import { useCircuit } from '../context/CircuitContext';
import { GATE_REGISTRY } from '../domain/gateRegistry';
import { GateType } from '../../../types/circuit';
import { MousePointer, Trash2, Info } from 'lucide-react';

interface GatePaletteProps {
  onOpenHelp: () => void;
}

export const GatePalette: React.FC<GatePaletteProps> = ({ onOpenHelp }) => {
  const { activeTool, setActiveTool } = useCircuit();

  const basicGates: GateType[] = ['H', 'X', 'Y', 'Z'];
  const phaseGates: GateType[] = ['S', 'T'];
  const multiQubitGates: GateType[] = ['CNOT'];
  const measurementGates: GateType[] = ['MEASURE'];

  const renderGateButton = (type: GateType) => {
    const def = GATE_REGISTRY[type];
    const isActive = activeTool === type;

    return (
      <button
        key={type}
        type="button"
        onClick={() => setActiveTool(type)}
        className="gate-palette-btn"
        aria-label={def.accessibleLabel}
        aria-pressed={isActive}
        title={`${def.name}: ${def.description}\nMatrix: ${def.matrixPreview}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.6rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          border: isActive
            ? `2px solid ${def.badgeColor}`
            : '1px solid var(--border-medium)',
          backgroundColor: isActive
            ? 'rgba(6, 182, 212, 0.12)'
            : 'var(--bg-surface)',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isActive ? `0 0 10px rgba(6, 182, 212, 0.25)` : 'none'
        }}
      >
        <span
          style={{
            fontSize: type === 'CNOT' ? '1rem' : '1.15rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: def.badgeColor
          }}
        >
          {def.symbol}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            marginTop: '0.2rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)'
          }}
        >
          {type === 'MEASURE' ? 'Readout' : def.name.split(' ')[0]}
        </span>
      </button>
    );
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1rem',
        width: '100%'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          Gate Palette
        </h2>
        <button
          type="button"
          onClick={onOpenHelp}
          className="btn-icon"
          title="How to build circuits"
          aria-label="How to build circuits guide"
          style={{ padding: '0.25rem', color: 'var(--accent-cyan)' }}
        >
          <Info size={16} />
        </button>
      </div>

      {/* Mode selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
        <button
          type="button"
          onClick={() => setActiveTool('SELECT')}
          className="btn btn-secondary"
          style={{
            fontSize: '0.75rem',
            padding: '0.4rem 0.5rem',
            justifyContent: 'center',
            borderColor: activeTool === 'SELECT' ? 'var(--accent-cyan)' : 'var(--border-light)',
            backgroundColor: activeTool === 'SELECT' ? 'rgba(6, 182, 212, 0.15)' : 'transparent'
          }}
        >
          <MousePointer size={14} />
          <span>Select</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTool('DELETE')}
          className="btn btn-secondary"
          style={{
            fontSize: '0.75rem',
            padding: '0.4rem 0.5rem',
            justifyContent: 'center',
            borderColor: activeTool === 'DELETE' ? 'var(--accent-rose)' : 'var(--border-light)',
            backgroundColor: activeTool === 'DELETE' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
            color: activeTool === 'DELETE' ? 'var(--accent-rose)' : 'var(--text-secondary)'
          }}
        >
          <Trash2 size={14} />
          <span>Erase</span>
        </button>
      </div>

      {/* 1. Basic Single Qubit */}
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
          Single-Qubit Gates
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
          {basicGates.map(renderGateButton)}
        </div>
      </div>

      {/* 2. Phase Gates */}
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
          Phase Rotations
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
          {phaseGates.map(renderGateButton)}
        </div>
      </div>

      {/* 3. Multi-Qubit Controlled */}
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
          Multi-Qubit (Entanglement)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem' }}>
          {multiQubitGates.map(renderGateButton)}
        </div>
      </div>

      {/* 4. Measurement Readout */}
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
          Measurement & Readout
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem' }}>
          {measurementGates.map(renderGateButton)}
        </div>
      </div>

      <div
        style={{
          marginTop: 'auto',
          padding: '0.6rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.4
        }}
      >
        💡 <strong style={{ color: 'var(--text-secondary)' }}>Tip:</strong> Click any gate above, then click an empty circuit slot to place it. Press <kbd style={{ padding: '0.1rem 0.3rem', background: 'var(--bg-elevated)', borderRadius: '3px' }}>Delete</kbd> or <kbd style={{ padding: '0.1rem 0.3rem', background: 'var(--bg-elevated)', borderRadius: '3px' }}>Ctrl+Z</kbd> anytime.
      </div>
    </div>
  );
};
