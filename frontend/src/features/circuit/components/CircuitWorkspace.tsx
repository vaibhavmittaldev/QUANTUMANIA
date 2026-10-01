/**
 * QUANTUMANIA - Interactive Circuit Canvas Workspace
 * Phase 3: Quantum Circuit Builder
 */

import React, { useMemo, useEffect } from 'react';
import { useCircuit } from '../context/CircuitContext';
import { GateCell } from './GateCell';
import { Plus, Minus } from 'lucide-react';
import { MIN_QUBITS, MAX_QUBITS } from '../domain/circuitDomain';
import { QuantumGate, GateType } from '../../../types/circuit';

const CELL_WIDTH = 56;
const ROW_HEIGHT = 68;
const QUBIT_HEADER_WIDTH = 70;

export const CircuitWorkspace: React.FC = () => {
  const {
    circuit,
    selectedGateId,
    selectGate,
    placeGateAt,
    moveGate,
    deleteSelectedGate,
    activeTool,
    setQubits,
    hoveredCell,
    setHoveredCell,
    highlightedGateId
  } = useCircuit();

  // Keyboard shortcut: Delete or Backspace removes selected gate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('.monaco-editor'))
      ) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGateId) {
        e.preventDefault();
        deleteSelectedGate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGateId, deleteSelectedGate]);

  // Determine total visible columns (at least 8, auto-expanding)
  const totalColumns = useMemo(() => {
    const maxGateStep = circuit.gates.reduce((max, g) => Math.max(max, g.step), -1);
    return Math.max(8, maxGateStep + 3);
  }, [circuit.gates]);

  // Lookup map: `${step}:${qubit}` -> QuantumGate
  const cellGateMap = useMemo(() => {
    const map = new Map<string, QuantumGate>();
    for (const gate of circuit.gates) {
      if (gate.type === 'CNOT') {
        if (gate.control !== undefined) {
          map.set(`${gate.step}:${gate.control}`, gate);
        }
        if (gate.target !== undefined) {
          map.set(`${gate.step}:${gate.target}`, gate);
        }
      } else {
        const targets = gate.targets && gate.targets.length > 0 ? gate.targets : [gate.target ?? 0];
        for (const t of targets) {
          map.set(`${gate.step}:${t}`, gate);
        }
      }
    }
    return map;
  }, [circuit.gates]);

  // Find all CNOT gates for drawing vertical SVG connector lines
  const cnotGates = useMemo(() => {
    return circuit.gates.filter(
      (g) => g.type === 'CNOT' && g.control !== undefined && g.target !== undefined
    );
  }, [circuit.gates]);

  // Find all MEASURE gates for drawing vertical readout arrows down to classical register
  const measureGates = useMemo(() => {
    return circuit.gates.filter((g) => g.type === 'MEASURE' && g.target !== undefined);
  }, [circuit.gates]);

  const handleCellClick = (step: number, qubit: number) => {
    const key = `${step}:${qubit}`;
    const existing = cellGateMap.get(key);

    if (existing) {
      selectGate(existing.id);
    } else {
      placeGateAt(step, qubit);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (step: number, qubit: number) => {
    setHoveredCell({ step, qubit });
  };

  const handleDragLeave = (step: number, qubit: number) => {
    if (hoveredCell?.step === step && hoveredCell?.qubit === qubit) {
      setHoveredCell(null);
    }
  };

  const handleDrop = (e: React.DragEvent, step: number, qubit: number) => {
    e.preventDefault();
    setHoveredCell(null);
    const moveGateId = e.dataTransfer.getData('application/quantum-move');
    const gateType = e.dataTransfer.getData('application/quantum-gate') as GateType | '';

    if (moveGateId) {
      moveGate(moveGateId, step, qubit);
    } else if (gateType) {
      placeGateAt(step, qubit, undefined, gateType);
    }
  };

  const handleAddQubit = () => {
    if (circuit.qubits < MAX_QUBITS) {
      setQubits(circuit.qubits + 1);
    }
  };

  const handleRemoveQubit = () => {
    if (circuit.qubits > MIN_QUBITS) {
      setQubits(circuit.qubits - 1);
    }
  };

  const totalGridWidth = totalColumns * CELL_WIDTH;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem',
        overflow: 'hidden',
        minHeight: '440px'
      }}
    >
      {/* Top Workspace Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Qubits:</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-medium)',
                overflow: 'hidden'
              }}
            >
              <button
                type="button"
                onClick={handleRemoveQubit}
                disabled={circuit.qubits <= MIN_QUBITS}
                className="btn-icon"
                title="Remove wire"
                aria-label="Remove qubit"
                style={{ padding: '0.3rem 0.5rem', borderRadius: 0 }}
              >
                <Minus size={14} />
              </button>
              <span
                style={{
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  minWidth: '28px',
                  textAlign: 'center'
                }}
              >
                {circuit.qubits}
              </span>
              <button
                type="button"
                onClick={handleAddQubit}
                disabled={circuit.qubits >= MAX_QUBITS}
                className="btn-icon"
                title="Add wire"
                aria-label="Add qubit"
                style={{ padding: '0.3rem 0.5rem', borderRadius: 0 }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
            Depth: {Math.max(0, circuit.gates.reduce((m, g) => Math.max(m, g.step + 1), 0))}
          </span>

          <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
            {circuit.gates.length} Operation{circuit.gates.length === 1 ? '' : 's'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Active tool:</span>
          <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
            {activeTool === 'SELECT' ? 'Pointer / Select' : activeTool === 'DELETE' ? 'Eraser' : activeTool}
          </span>
        </div>
      </div>

      {/* Circuit Canvas Scroll Container */}
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          backgroundColor: 'rgba(10, 15, 29, 0.7)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1rem',
          position: 'relative'
        }}
      >
        <div
          style={{
            display: 'inline-block',
            minWidth: `${QUBIT_HEADER_WIDTH + totalGridWidth + 40}px`,
            position: 'relative'
          }}
        >
          {/* Timeline Step Headers */}
          <div style={{ display: 'flex', marginLeft: `${QUBIT_HEADER_WIDTH}px`, marginBottom: '0.5rem' }}>
            {Array.from({ length: totalColumns }).map((_, stepIdx) => (
              <div
                key={stepIdx}
                style={{
                  width: `${CELL_WIDTH}px`,
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace',
                  userSelect: 'none'
                }}
              >
                t{stepIdx}
              </div>
            ))}
          </div>

          {/* SVG Overlay for CNOT vertical lines and measurement connections */}
          <svg
            style={{
              position: 'absolute',
              top: '28px',
              left: `${QUBIT_HEADER_WIDTH}px`,
              width: `${totalGridWidth}px`,
              height: `${circuit.qubits * ROW_HEIGHT + ROW_HEIGHT}px`,
              pointerEvents: 'none',
              zIndex: 2
            }}
          >
            {/* CNOT vertical connecting lines */}
            {cnotGates.map((g) => {
              const cQubit = g.control ?? 0;
              const tQubit = g.target ?? 1;
              const xPos = g.step * CELL_WIDTH + CELL_WIDTH / 2;
              const y1 = cQubit * ROW_HEIGHT + ROW_HEIGHT / 2;
              const y2 = tQubit * ROW_HEIGHT + ROW_HEIGHT / 2;
              const isSelected = selectedGateId === g.id;

              return (
                <g key={`cnot-line-${g.id}`}>
                  <line
                    x1={xPos}
                    y1={y1}
                    x2={xPos}
                    y2={y2}
                    stroke={isSelected ? '#ffffff' : 'var(--accent-purple)'}
                    strokeWidth={isSelected ? '3' : '2'}
                    strokeDasharray={isSelected ? 'none' : 'none'}
                  />
                </g>
              );
            })}

            {/* Measurement readout vertical drop lines to classical bus */}
            {measureGates.map((g) => {
              const q = g.target ?? 0;
              const xPos = g.step * CELL_WIDTH + CELL_WIDTH / 2;
              const y1 = q * ROW_HEIGHT + ROW_HEIGHT / 2;
              const yClassical = circuit.qubits * ROW_HEIGHT + ROW_HEIGHT / 2;

              return (
                <g key={`measure-line-${g.id}`}>
                  <line
                    x1={xPos}
                    y1={y1}
                    x2={xPos}
                    y2={yClassical}
                    stroke="var(--accent-emerald)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  {/* Arrowhead at classical register */}
                  <polygon
                    points={`${xPos - 4},${yClassical - 6} ${xPos + 4},${yClassical - 6} ${xPos},${yClassical}`}
                    fill="var(--accent-emerald)"
                  />
                </g>
              );
            })}
          </svg>

          {/* Qubit Wires Rows */}
          {Array.from({ length: circuit.qubits }).map((_, qIdx) => (
            <div
              key={`row-q${qIdx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: `${ROW_HEIGHT}px`,
                position: 'relative'
              }}
            >
              {/* Qubit Label Header */}
              <div
                style={{
                  width: `${QUBIT_HEADER_WIDTH}px`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  userSelect: 'none',
                  paddingRight: '0.5rem'
                }}
              >
                <span style={{ color: 'var(--accent-cyan)' }}>q{qIdx}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>|0⟩</span>
              </div>

              {/* Horizontal Wire Line behind cells */}
              <div
                style={{
                  position: 'absolute',
                  left: `${QUBIT_HEADER_WIDTH}px`,
                  right: '0',
                  top: '50%',
                  height: '2px',
                  backgroundColor: 'var(--border-medium)',
                  zIndex: 1
                }}
              />

              {/* Grid Column Cells */}
              <div style={{ display: 'flex', zIndex: 3 }}>
                {Array.from({ length: totalColumns }).map((_, stepIdx) => {
                  const gate = cellGateMap.get(`${stepIdx}:${qIdx}`);
                  const isSelected = gate ? selectedGateId === gate.id : false;
                  const isHighlighted = gate ? highlightedGateId === gate.id : false;
                  const isHovered = hoveredCell?.step === stepIdx && hoveredCell?.qubit === qIdx;

                  return (
                    <div
                      key={`cell-${stepIdx}-${qIdx}`}
                      onClick={() => handleCellClick(stepIdx, qIdx)}
                      onDragOver={handleDragOver}
                      onDragEnter={() => handleDragEnter(stepIdx, qIdx)}
                      onDragLeave={() => handleDragLeave(stepIdx, qIdx)}
                      onDrop={(e) => handleDrop(e, stepIdx, qIdx)}
                      style={{
                        width: `${CELL_WIDTH}px`,
                        height: `${ROW_HEIGHT}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        backgroundColor: isHovered ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {gate ? (
                        <GateCell
                          gate={gate}
                          qubitIndex={qIdx}
                          isSelected={isSelected}
                          isHighlighted={isHighlighted}
                          onSelect={() => selectGate(gate.id)}
                        />
                      ) : (
                        <div
                          className="circuit-empty-slot"
                          style={{
                            width: isHovered ? '32px' : '24px',
                            height: isHovered ? '32px' : '24px',
                            borderRadius: '6px',
                            border: isHovered
                              ? '2px dashed var(--accent-cyan)'
                              : '1px dashed rgba(255, 255, 255, 0.18)',
                            backgroundColor: isHovered
                              ? 'rgba(6, 182, 212, 0.22)'
                              : 'transparent',
                            boxShadow: isHovered
                              ? '0 0 12px rgba(6, 182, 212, 0.45)'
                              : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: isHovered ? 'scale(1.15)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isHovered && (
                            <span
                              style={{
                                fontSize: '0.85rem',
                                color: 'var(--accent-cyan)',
                                fontWeight: 800,
                                lineHeight: 1
                              }}
                            >
                              +
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Classical Register Row at bottom (Double line standard) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: `${ROW_HEIGHT}px`,
              position: 'relative',
              marginTop: '0.5rem',
              borderTop: '1px dashed var(--border-light)',
              paddingTop: '0.5rem'
            }}
          >
            <div
              style={{
                width: `${QUBIT_HEADER_WIDTH}px`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                userSelect: 'none'
              }}
            >
              <span>c / {circuit.classical_bits}b</span>
            </div>

            {/* Classical Double Bus Line */}
            <div
              style={{
                position: 'absolute',
                left: `${QUBIT_HEADER_WIDTH}px`,
                right: '0',
                top: 'calc(50% - 2px)',
                height: '1px',
                backgroundColor: 'var(--border-medium)',
                zIndex: 1
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${QUBIT_HEADER_WIDTH}px`,
                right: '0',
                top: 'calc(50% + 2px)',
                height: '1px',
                backgroundColor: 'var(--border-medium)',
                zIndex: 1
              }}
            />

            {/* Column ticks for classical register */}
            <div style={{ display: 'flex', zIndex: 2 }}>
              {Array.from({ length: totalColumns }).map((_, stepIdx) => (
                <div
                  key={`c-tick-${stepIdx}`}
                  style={{
                    width: `${CELL_WIDTH}px`,
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace'
                  }}
                >
                  /
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
