/**
 * QUANTUMANIA - Gate Cell Renderer
 * Phase 3: Quantum Circuit Builder
 */

import React from 'react';
import { QuantumGate } from '../../../types/circuit';
import { GATE_REGISTRY } from '../domain/gateRegistry';

interface GateCellProps {
  gate: QuantumGate;
  qubitIndex: number;
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
}

export const GateCell: React.FC<GateCellProps> = ({
  gate,
  qubitIndex,
  isSelected,
  isHighlighted = false,
  onSelect
}) => {
  const isCnot = gate.type === 'CNOT';
  const isCnotControl = isCnot && gate.control === qubitIndex;
  const isCnotTarget = isCnot && (gate.target === qubitIndex || (gate.targets && gate.targets.includes(qubitIndex)));
  const def = GATE_REGISTRY[gate.type] || GATE_REGISTRY['X'];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/quantum-move', gate.id);
    e.dataTransfer.effectAllowed = 'move';
    onSelect();
  };

  if (isCnot) {
    if (isCnotControl) {
      return (
        <div
          role="button"
          tabIndex={0}
          draggable={true}
          onDragStart={handleDragStart}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect();
            }
          }}
          aria-label={`CNOT Control node on qubit ${qubitIndex} at step ${gate.step}`}
          title={`CNOT Control (q${qubitIndex} → q${gate.target}) - Drag to move`}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-purple)',
            border: isSelected
              ? '3px solid #ffffff'
              : isHighlighted
              ? '3px solid var(--accent-cyan)'
              : '2px solid rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            zIndex: 3,
            boxShadow: isSelected
              ? '0 0 12px var(--accent-purple), 0 0 4px #fff'
              : isHighlighted
              ? '0 0 14px var(--accent-cyan), 0 0 6px #06b6d4'
              : '0 0 6px rgba(168, 85, 247, 0.4)',
            transform: isHighlighted ? 'scale(1.15)' : 'none',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        />
      );
    }

    if (isCnotTarget) {
      return (
        <div
          role="button"
          tabIndex={0}
          draggable={true}
          onDragStart={handleDragStart}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect();
            }
          }}
          aria-label={`CNOT Target node (NOT) on qubit ${qubitIndex} at step ${gate.step}`}
          title={`CNOT Target (Controlled by q${gate.control}) - Drag to move`}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-elevated)',
            border: isSelected
              ? '2px solid #ffffff'
              : isHighlighted
              ? '2px solid var(--accent-cyan)'
              : '2px solid var(--accent-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            zIndex: 3,
            boxShadow: isSelected
              ? '0 0 12px var(--accent-purple), 0 0 4px #fff'
              : isHighlighted
              ? '0 0 14px var(--accent-cyan), 0 0 6px #06b6d4'
              : '0 0 6px rgba(168, 85, 247, 0.3)',
            transform: isHighlighted ? 'scale(1.15)' : 'none',
            position: 'relative',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          {/* Target crosshair symbol (+) */}
          <span
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              lineHeight: 1,
              color: isHighlighted ? 'var(--accent-cyan)' : 'var(--accent-purple)',
              userSelect: 'none'
            }}
          >
            ⊕
          </span>
        </div>
      );
    }
  }

  // Single-Qubit & Measurement Gates
  const isMeasure = gate.type === 'MEASURE';

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={true}
      onDragStart={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`${def.name} on qubit ${qubitIndex} at step ${gate.step}`}
      title={`${def.name}: ${def.description} - Drag to move`}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: isMeasure ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
        border: isSelected
          ? '2px solid #ffffff'
          : isHighlighted
          ? '2px solid var(--accent-cyan)'
          : `2px solid ${def.badgeColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        zIndex: 3,
        boxShadow: isSelected
          ? `0 0 14px ${def.badgeColor}, 0 0 4px #ffffff`
          : isHighlighted
          ? '0 0 14px var(--accent-cyan), 0 0 6px #06b6d4'
          : `0 2px 6px rgba(0, 0, 0, 0.4)`,
        transform: isHighlighted ? 'scale(1.12)' : 'none',
        transition: 'all 0.15s ease'
      }}
    >
      <span
        style={{
          fontSize: '1rem',
          fontWeight: 800,
          fontFamily: 'monospace',
          color: isSelected ? '#ffffff' : isHighlighted ? 'var(--accent-cyan)' : def.badgeColor,
          lineHeight: 1
        }}
      >
        {isMeasure ? 'M' : def.symbol}
      </span>
      {isMeasure && (
        <span
          style={{
            fontSize: '0.55rem',
            color: 'var(--accent-emerald)',
            lineHeight: 1,
            marginTop: '2px',
            textTransform: 'uppercase'
          }}
        >
          Read
        </span>
      )}
    </div>
  );
};
