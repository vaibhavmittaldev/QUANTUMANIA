import React, { useState } from 'react';
import {
  CanonicalCircuit,
  QuantumGate,
  GateType
} from '../../../types/circuit';
import {
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  RotateCw,
  X,
  Layers,
  Sliders
} from 'lucide-react';
import { GateDefinition, GATES_CATALOG } from './GateToolbox';

interface CircuitCanvasProps {
  circuit: CanonicalCircuit;
  onChange: (updatedCircuit: CanonicalCircuit) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  circuit,
  onChange,
  undo,
  redo,
  canUndo,
  canRedo
}) => {
  const [editParamModal, setEditParamModal] = useState<QuantumGate | null>(null);
  const [paramInput, setParamInput] = useState<string>('pi/2');

  const operations = circuit.gates || circuit.operations || [];
  const numQubits = circuit.qubits || circuit.numQubits || 2;
  const numClassicalBits = circuit.classical_bits || circuit.numClassicalBits || 2;
  const depth = circuit.depth !== undefined ? circuit.depth : operations.reduce((max, g) => Math.max(max, (g.step ?? g.column ?? 0) + 1), 0);
  const numColumns = Math.max(8, depth + 3);

  // Helper to find gate info
  const getGateDef = (typeOrSymbol: string): GateDefinition => {
    return (
      GATES_CATALOG.find((g) => g.symbol.toUpperCase() === typeOrSymbol.toUpperCase()) || {
        symbol: typeOrSymbol,
        name: typeOrSymbol,
        category: 'single',
        colorClass: 'text-cyan-400',
        bgClass: 'bg-cyan-950/60',
        borderClass: 'border-cyan-500/50',
        description: ''
      }
    );
  };

  // Add Qubit
  const addQubit = () => {
    if (numQubits >= 10) return;
    onChange({
      ...circuit,
      qubits: numQubits + 1,
      numQubits: numQubits + 1
    });
  };

  // Remove Qubit
  const removeQubit = () => {
    if (numQubits <= 1) return;
    const targetQ = numQubits - 1;
    // Remove gates using this qubit
    const remainingOps = operations.filter((op) => {
      const tgts = op.targets || (op.target !== undefined ? [op.target] : []);
      const ctrls = op.controls || (op.control !== undefined ? [op.control] : []);
      return !tgts.includes(targetQ) && !ctrls.includes(targetQ);
    });

    const maxStep = remainingOps.reduce((max, g) => Math.max(max, g.step ?? g.column ?? 0), -1);

    onChange({
      ...circuit,
      qubits: numQubits - 1,
      numQubits: numQubits - 1,
      gates: remainingOps,
      operations: remainingOps,
      depth: maxStep >= 0 ? maxStep + 1 : 0
    });
  };

  // Clear Canvas
  const clearCanvas = () => {
    onChange({
      ...circuit,
      gates: [],
      operations: [],
      measurements: [],
      depth: 0
    });
  };

  // Remove Gate
  const removeOperation = (gateId: string) => {
    const updatedOps = operations.filter((op) => op.id !== gateId);
    const maxCol = updatedOps.reduce((max, op) => Math.max(max, op.step ?? op.column ?? 0), -1);
    onChange({
      ...circuit,
      gates: updatedOps,
      operations: updatedOps,
      depth: maxCol >= 0 ? maxCol + 1 : 0
    });
  };

  // Handle Drag Drop into a Cell
  const handleDropOnCell = (qubitIdx: number, colIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    const symbolStr = e.dataTransfer.getData('application/quantum-gate');
    
    let gateDef: GateDefinition | null = null;
    if (dataStr) {
      try {
        gateDef = JSON.parse(dataStr);
      } catch {
        // Fallback
      }
    }
    if (!gateDef && symbolStr) {
      gateDef = getGateDef(symbolStr);
    }
    if (!gateDef) return;

    let newOp: QuantumGate = {
      id: `gate-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: gateDef.symbol as GateType,
      target: qubitIdx,
      targets: [qubitIdx],
      step: colIdx,
      column: colIdx
    };

    if (gateDef.symbol === 'CX' || gateDef.symbol === 'CNOT') {
      const ctrl = qubitIdx === 0 ? 1 : 0;
      newOp.type = 'CNOT';
      newOp.control = ctrl;
      newOp.controls = [ctrl];
      newOp.target = qubitIdx;
      newOp.targets = [qubitIdx];
    } else if (gateDef.symbol === 'CZ') {
      const ctrl = qubitIdx === 0 ? 1 : 0;
      newOp.type = 'CZ';
      newOp.control = ctrl;
      newOp.controls = [ctrl];
      newOp.target = qubitIdx;
      newOp.targets = [qubitIdx];
    } else if (gateDef.symbol === 'SWAP') {
      const other = qubitIdx === 0 ? 1 : 0;
      newOp.type = 'SWAP';
      newOp.target = qubitIdx;
      newOp.targets = [qubitIdx, other];
    } else if (['RX', 'RY', 'RZ'].includes(gateDef.symbol)) {
      newOp.params = { theta: Math.PI / 2 };
      newOp.parameters = { theta: gateDef.defaultParam || 'pi/2' };
    } else if (gateDef.symbol === 'MEASURE') {
      newOp.type = 'MEASURE';
      newOp.target = qubitIdx;
    }

    // Filter out existing gate occupying this cell
    const filtered = operations.filter((op) => {
      const c = op.step ?? op.column ?? 0;
      if (c !== colIdx) return true;
      const tgts = op.targets || (op.target !== undefined ? [op.target] : []);
      const ctrls = op.controls || (op.control !== undefined ? [op.control] : []);
      return !tgts.includes(qubitIdx) && !ctrls.includes(qubitIdx);
    });

    const nextOps = [...filtered, newOp];
    const maxCol = nextOps.reduce((max, op) => Math.max(max, op.step ?? op.column ?? 0), 0);

    onChange({
      ...circuit,
      gates: nextOps,
      operations: nextOps,
      depth: maxCol + 1
    });
  };

  // Update Parameter
  const saveParamEdit = () => {
    if (!editParamModal) return;
    const updated = operations.map((op) => {
      if (op.id === editParamModal.id) {
        return {
          ...op,
          params: { ...(op.params || {}), theta: paramInput },
          parameters: { ...(op.parameters || {}), theta: paramInput }
        };
      }
      return op;
    });
    onChange({
      ...circuit,
      gates: updated,
      operations: updated
    });
    setEditParamModal(null);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0f1d',
        border: '1px solid rgba(8, 51, 68, 0.7)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        minWidth: 0
      }}
    >
      {/* Canvas Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#080c18',
          borderBottom: '1px solid #1e293b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#cbd5e1',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={14} color="#00F2FE" />
            Circuit Canvas
          </span>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#00F2FE',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.25)'
            }}
          >
            {numQubits} Qubits &bull; Depth {depth} &bull; {operations.length} Gates
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: canUndo ? '#cbd5e1' : '#475569',
              border: '1px solid #1e293b',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: canRedo ? '#cbd5e1' : '#475569',
              border: '1px solid #1e293b',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw size={13} />
          </button>

          <div style={{ height: '16px', width: '1px', backgroundColor: '#1e293b', margin: '0 4px' }} />

          <button
            type="button"
            onClick={addQubit}
            disabled={numQubits >= 10}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '6px',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              cursor: numQubits >= 10 ? 'not-allowed' : 'pointer'
            }}
          >
            <Plus size={12} /> Qubit
          </button>
          <button
            type="button"
            onClick={removeQubit}
            disabled={numQubits <= 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: numQubits <= 1 ? '#475569' : '#f87171',
              border: '1px solid #1e293b',
              cursor: numQubits <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <Minus size={12} /> Qubit
          </button>

          <div style={{ height: '16px', width: '1px', backgroundColor: '#1e293b', margin: '0 4px' }} />

          <button
            type="button"
            onClick={clearCanvas}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#f87171',
              border: '1px solid #1e293b',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Interactive Circuit Grid */}
      <div
        className="quantum-grid-bg ql-scrollbar"
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'inline-block', minWidth: '100%', position: 'relative' }}>
          {/* Render Qubit Wires */}
          {Array.from({ length: numQubits }).map((_, qIdx) => (
            <div
              key={`wire-${qIdx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
                position: 'relative'
              }}
            >
              {/* Qubit Label */}
              <div
                style={{
                  width: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingRight: '12px',
                  flexShrink: 0
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#00F2FE'
                  }}
                >
                  q[{qIdx}]
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '10px',
                    color: '#64748b'
                  }}
                >
                  |0⟩
                </span>
              </div>

              {/* Wire Line & Cells */}
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {/* Horizontal Wire Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: 'rgba(8, 51, 68, 0.5)',
                    pointerEvents: 'none'
                  }}
                />

                {/* Columns */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 10 }}>
                  {Array.from({ length: numColumns }).map((_, colIdx) => {
                    const op = operations.find((o) => {
                      const c = o.step ?? o.column ?? 0;
                      if (c !== colIdx) return false;
                      const tgts = o.targets || (o.target !== undefined ? [o.target] : []);
                      const ctrls = o.controls || (o.control !== undefined ? [o.control] : []);
                      return tgts.includes(qIdx) || ctrls.includes(qIdx);
                    });

                    const ctrls = op ? op.controls || (op.control !== undefined ? [op.control] : []) : [];
                    const tgts = op ? op.targets || (op.target !== undefined ? [op.target] : []) : [];
                    const isControl = op && ctrls.includes(qIdx);
                    const isTarget = op && tgts.includes(qIdx);
                    const gateDef = op ? getGateDef(op.type || (op as any).gate) : null;

                    // Color tokens
                    const categoryBorderColor = 
                      gateDef?.category === 'single' ? '#3b82f6' :
                      gateDef?.category === 'rotation' ? '#a855f7' :
                      gateDef?.category === 'phase' ? '#14b8a6' :
                      gateDef?.category === 'multi' ? '#f59e0b' :
                      gateDef?.category === 'measure' ? '#ec4899' : '#64748b';

                    const categoryBgColor =
                      gateDef?.category === 'single' ? 'rgba(30, 58, 138, 0.6)' :
                      gateDef?.category === 'rotation' ? 'rgba(88, 28, 135, 0.6)' :
                      gateDef?.category === 'phase' ? 'rgba(19, 78, 74, 0.6)' :
                      gateDef?.category === 'multi' ? 'rgba(120, 53, 15, 0.6)' :
                      gateDef?.category === 'measure' ? 'rgba(131, 24, 67, 0.6)' : 'rgba(30, 41, 59, 0.7)';

                    return (
                      <div
                        key={`cell-${qIdx}-${colIdx}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnCell(qIdx, colIdx, e)}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          border: op
                            ? `1px solid ${categoryBorderColor}`
                            : '1px dashed rgba(51, 65, 85, 0.4)',
                          backgroundColor: op ? categoryBgColor : 'rgba(15, 23, 42, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {op && (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative'
                            }}
                          >
                            {isControl ? (
                              /* Control Node */
                              <div
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: '#00F2FE',
                                  boxShadow: '0 0 10px rgba(0, 242, 254, 0.6)'
                                }}
                              />
                            ) : (op.type === 'CNOT' || (op as any).gate === 'CX') && isTarget ? (
                              /* CNOT Target Circle with Cross */
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  border: '2px solid #f59e0b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#f59e0b',
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  lineHeight: 1
                                }}
                              >
                                +
                              </div>
                            ) : (op.type === 'SWAP' || (op as any).gate === 'SWAP') ? (
                              /* SWAP Cross */
                              <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '15px' }}>
                                &#10006;
                              </span>
                            ) : (
                              /* Standard Gate Block */
                              <div style={{ textAlign: 'center' }}>
                                <span
                                  style={{
                                    fontFamily: 'var(--font-mono, monospace)',
                                    fontWeight: 'bold',
                                    fontSize: '12px',
                                    color: '#f8fafc'
                                  }}
                                >
                                  {gateDef?.displaySymbol || op.type || (op as any).gate}
                                </span>
                                {(op.params?.theta || op.parameters?.theta) && (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditParamModal(op);
                                      setParamInput(String(op.params?.theta || op.parameters?.theta || 'pi/2'));
                                    }}
                                    style={{
                                      fontSize: '9px',
                                      fontFamily: 'var(--font-mono, monospace)',
                                      color: '#c084fc',
                                      cursor: 'pointer',
                                      textDecoration: 'underline',
                                      lineHeight: 1
                                    }}
                                  >
                                    θ={String(op.params?.theta || op.parameters?.theta)}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Gate Delete Action Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeOperation(op.id);
                              }}
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#881337',
                                border: '1px solid #f43f5e',
                                color: '#fecdd3',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0
                              }}
                              title="Delete Gate"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Render Multi-Qubit Vertical Connecting Lines */}
          {operations
            .filter((op) => {
              const ctrls = op.controls || (op.control !== undefined ? [op.control] : []);
              const tgts = op.targets || (op.target !== undefined ? [op.target] : []);
              return ctrls.length > 0 || tgts.length > 1;
            })
            .map((op) => {
              const ctrls = op.controls || (op.control !== undefined ? [op.control] : []);
              const tgts = op.targets || (op.target !== undefined ? [op.target] : []);
              const allQubits = [...ctrls, ...tgts];
              const minQ = Math.min(...allQubits);
              const maxQ = Math.max(...allQubits);
              if (minQ === maxQ) return null;

              // Vertical offset: each wire height 44px + 24px mb = 68px
              const topOffset = minQ * 68 + 22;
              const height = (maxQ - minQ) * 68;
              const col = op.step ?? op.column ?? 0;
              const leftOffset = 64 + col * (44 + 12) + 22;

              return (
                <div
                  key={`line-${op.id}`}
                  style={{
                    position: 'absolute',
                    top: `${topOffset}px`,
                    left: `${leftOffset}px`,
                    height: `${height}px`,
                    width: '2px',
                    backgroundColor: '#f59e0b',
                    boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)',
                    pointerEvents: 'none',
                    zIndex: 5
                  }}
                />
              );
            })}

          {/* Classical Bits Wire Register */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(30, 41, 59, 0.8)'
            }}
          >
            <div
              style={{
                width: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingRight: '12px',
                flexShrink: 0
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#94a3b8'
                }}
              >
                c[{numClassicalBits}]
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '10px',
                  color: '#64748b'
                }}
              >
                /
              </span>
            </div>
            <div
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '4px',
                  borderTop: '1px solid #475569',
                  borderBottom: '1px solid #475569',
                  pointerEvents: 'none'
                }}
              />
              <div
                style={{
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: '#64748b',
                  paddingLeft: '16px'
                }}
              >
                Classical Register ({numClassicalBits} bits)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parameter Edit Modal */}
      {editParamModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0e1428',
              border: '1px solid rgba(6, 182, 212, 0.6)',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid #1e293b'
              }}
            >
              <h4
                style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: 0
                }}
              >
                <Sliders size={14} color="#c084fc" />
                Configure Gate Parameter (&theta;)
              </h4>
              <button
                type="button"
                onClick={() => setEditParamModal(null)}
                style={{ color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
              Set rotation angle for gate{' '}
              <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: '#c084fc' }}>
                {editParamModal.type}
              </strong>
              :
            </p>

            <input
              type="text"
              value={paramInput}
              onChange={(e) => setParamInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#080c18',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#f8fafc',
                outline: 'none',
                marginBottom: '12px'
              }}
              placeholder="e.g. pi/2, 3.1415, pi/4"
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {['pi', 'pi/2', 'pi/4', '3pi/4', '-pi/2'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setParamInput(preset)}
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono, monospace)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    color: '#c084fc',
                    cursor: 'pointer'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEditParamModal(null)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveParamEdit}
                style={{
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  backgroundColor: '#9333ea',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Save Parameter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
