import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Binary,
  Globe2,
  Clock,
  Info,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';
import { SimulationResult, CanonicalCircuit } from '../../../types/circuit';

interface ResultsVisualizerProps {
  result: SimulationResult;
  circuit: CanonicalCircuit;
  onStepChange?: (stepIndex: number) => void;
}

export const ResultsVisualizer: React.FC<ResultsVisualizerProps> = ({
  result,
  circuit,
  onStepChange
}) => {
  const [activeTab, setActiveTab] = useState<
    'histogram' | 'statevector' | 'bloch' | 'evolution' | 'details'
  >('histogram');
  const [selectedQubit, setSelectedQubit] = useState<number>(0);
  const [evolutionStep, setEvolutionStep] = useState<number>(result.currentStep ?? result.depth ?? 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const numQubits = result.numQubits || result.qubits || circuit.qubits || 2;
  const circuitDepth = result.depth || circuit.depth || 1;

  // Tabs
  const tabs = [
    { id: 'histogram', label: 'Measurement Histogram', icon: BarChart2 },
    { id: 'statevector', label: 'Statevector Amplitudes', icon: Binary },
    { id: 'bloch', label: 'Bloch Sphere', icon: Globe2 },
    { id: 'evolution', label: 'State Evolution', icon: Clock },
    { id: 'details', label: 'Circuit Details & Info', icon: Info }
  ];

  // Max count for scaling histogram
  const counts = result.counts || {};
  const maxCount = Math.max(1, ...Object.values(counts));
  const totalShots = result.shots || 1024;

  // Step Scrubber
  const handleStep = (step: number) => {
    const s = Math.max(0, Math.min(circuitDepth, step));
    setEvolutionStep(s);
    if (onStepChange) onStepChange(s);
  };

  // Play step animation
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setEvolutionStep((prev) => {
          if (prev >= circuitDepth) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          if (onStepChange) onStepChange(next);
          return next;
        });
      }, 900);
    }
    return () => clearInterval(interval);
  }, [isPlaying, circuitDepth, onStepChange]);

  // Export CSV
  const downloadCountsCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Basis State,Counts,Probability\n' +
      Object.entries(counts)
        .map(([state, cnt]) => `|${state}>,${cnt},${(cnt / totalShots).toFixed(4)}`)
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quantumlab_counts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadStatevectorCSV = () => {
    if (!result.statevector) return;
    const csvContent =
      'data:text/csv;charset=utf-8,Basis State,Real,Imaginary,Probability\n' +
      result.statevector
        .map((c) => {
          const prob = (c.real ** 2 + c.imag ** 2).toFixed(6);
          return `|${c.basis}>,${c.real.toFixed(6)},${c.imag.toFixed(6)},${prob}`;
        })
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quantumlab_statevector_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    const jsonStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `quantumlab_simulation_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bloch vector computation for selected qubit (reduced density matrix / state)
  // Check if bloch_vectors exists from backend
  const precomputedBloch = (result.bloch_vectors || []).find((b) => b.qubit === selectedQubit);
  
  let blochX = precomputedBloch ? precomputedBloch.x : 0;
  let blochY = precomputedBloch ? precomputedBloch.y : 0;
  let blochZ = precomputedBloch ? precomputedBloch.z : 1;

  // Projective Probabilities
  const bit0Count = Object.entries(result.probabilities || {}).reduce((acc, [k, p]) => {
    const char = k[k.length - 1 - selectedQubit] || '0';
    return char === '0' ? acc + p : acc;
  }, 0);
  const bit1Count = Math.max(0, 1.0 - bit0Count);

  if (!precomputedBloch) {
    blochZ = Math.min(1.0, Math.max(-1.0, bit0Count - bit1Count));
    const theta = Math.acos(Math.max(-1, Math.min(1, blochZ)));
    blochX = Math.sin(theta);
    blochY = 0.0;
  }

  return (
    <div
      style={{
        backgroundColor: '#0a0f1d',
        border: '1px solid rgba(8, 51, 68, 0.7)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header & Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: '#080c18',
          borderBottom: '1px solid #1e293b',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
                  color: isActive ? '#00F2FE' : '#94a3b8',
                  border: isActive ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 12px rgba(6, 182, 212, 0.2)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} color={isActive ? '#00F2FE' : '#94a3b8'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Download Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={downloadJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#cbd5e1',
              border: '1px solid #1e293b',
              cursor: 'pointer'
            }}
            title="Download Full Simulation Result JSON"
          >
            <FileJson size={12} color="#00F2FE" />
            <span>JSON</span>
          </button>
          <button
            type="button"
            onClick={downloadCountsCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#cbd5e1',
              border: '1px solid #1e293b',
              cursor: 'pointer'
            }}
            title="Download Measurement Counts CSV"
          >
            <FileSpreadsheet size={12} color="#34d399" />
            <span>Counts CSV</span>
          </button>
          <button
            type="button"
            onClick={downloadStatevectorCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#cbd5e1',
              border: '1px solid #1e293b',
              cursor: 'pointer'
            }}
            title="Download Statevector CSV"
          >
            <FileSpreadsheet size={12} color="#c084fc" />
            <span>State CSV</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div style={{ padding: '20px', flex: 1, minHeight: '320px' }}>
        {/* 1. Measurement Histogram */}
        {activeTab === 'histogram' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#f1f5f9',
                    margin: 0
                  }}
                >
                  Measurement Distribution (Shots: {totalShots})
                </h4>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Observed measurement counts and empirical probability per basis state.
                </p>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  color: '#00F2FE',
                  backgroundColor: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}
              >
                Framework: {result.backend?.framework || 'Qiskit'} ({result.backend?.id || 'qiskit-aer'})
              </span>
            </div>

            {Object.keys(counts).length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 0',
                  color: '#64748b',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono, monospace)'
                }}
              >
                No measurement counts generated. Run circuit with measurement mode.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(counts).map(([state, cnt]) => {
                  const prob = (cnt / totalShots) * 100;
                  return (
                    <div key={state} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono, monospace)'
                        }}
                      >
                        <span style={{ color: '#00F2FE', fontWeight: 'bold' }}>|{state}⟩</span>
                        <span style={{ color: '#94a3b8' }}>
                          {cnt} shots &bull; <strong style={{ color: '#f1f5f9' }}>{prob.toFixed(1)}%</strong>
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '22px',
                          backgroundColor: '#030712',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #1e293b',
                          padding: '2px'
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.max(4, (cnt / maxCount) * 100)}%`,
                            background: 'linear-gradient(90deg, #06b6d4 0%, #2563eb 100%)',
                            borderRadius: '6px',
                            transition: 'width 0.5s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '8px',
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono, monospace)',
                            color: '#ffffff',
                            fontWeight: 'bold'
                          }}
                        >
                          {prob >= 10 && `${prob.toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. Statevector Table */}
        {activeTab === 'statevector' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#f1f5f9',
                    margin: 0
                  }}
                >
                  Canonical Statevector (2^{numQubits} = {1 << numQubits} Amplitudes)
                </h4>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Complex amplitudes &alpha; = Re + i&middot;Im and Born rule probabilities P = |&alpha;|&sup2;.
                </p>
              </div>
            </div>

            {!result.statevector || result.statevector.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 0',
                  color: '#64748b',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono, monospace)'
                }}
              >
                Statevector unavailable for selected simulation mode.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono, monospace)',
                    borderCollapse: 'collapse'
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                      <th style={{ padding: '8px 12px' }}>Basis State</th>
                      <th style={{ padding: '8px 12px' }}>Real (Re)</th>
                      <th style={{ padding: '8px 12px' }}>Imag (Im)</th>
                      <th style={{ padding: '8px 12px' }}>Magnitude |&alpha;|</th>
                      <th style={{ padding: '8px 12px' }}>Probability |&alpha;|&sup2;</th>
                      <th style={{ padding: '8px 12px' }}>Visual Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.statevector.map((c) => {
                      const mag = Math.sqrt(c.real ** 2 + c.imag ** 2);
                      const prob = c.real ** 2 + c.imag ** 2;
                      return (
                        <tr
                          key={c.basis}
                          style={{
                            borderBottom: '1px solid rgba(30, 41, 59, 0.4)',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '8px 12px', color: '#00F2FE', fontWeight: 'bold' }}>
                            |{c.basis}⟩
                          </td>
                          <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{c.real.toFixed(4)}</td>
                          <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{c.imag.toFixed(4)}i</td>
                          <td style={{ padding: '8px 12px', color: '#c084fc' }}>{mag.toFixed(4)}</td>
                          <td style={{ padding: '8px 12px', color: '#34d399' }}>{(prob * 100).toFixed(2)}%</td>
                          <td style={{ padding: '8px 12px', width: '160px' }}>
                            <div
                              style={{
                                width: '100%',
                                height: '10px',
                                backgroundColor: '#030712',
                                borderRadius: '9999px',
                                overflow: 'hidden',
                                border: '1px solid #1e293b'
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${prob * 100}%`,
                                  backgroundColor: '#00F2FE',
                                  borderRadius: '9999px',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. Bloch Sphere */}
        {activeTab === 'bloch' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#f1f5f9',
                    margin: 0
                  }}
                >
                  Bloch Sphere State Representation
                </h4>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Single-qubit projection on the Riemann sphere (x, y, z).
                </p>
              </div>

              {/* Qubit Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)' }}>
                  Qubit:
                </span>
                {Array.from({ length: numQubits }).map((_, q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedQubit(q)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono, monospace)',
                      backgroundColor: selectedQubit === q ? 'rgba(6, 182, 212, 0.25)' : '#0f172a',
                      color: selectedQubit === q ? '#00F2FE' : '#94a3b8',
                      border: selectedQubit === q ? '1px solid #00F2FE' : '1px solid #1e293b',
                      fontWeight: selectedQubit === q ? 'bold' : 'normal',
                      cursor: 'pointer'
                    }}
                  >
                    q[{q}]
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                alignItems: 'center'
              }}
            >
              {/* SVG 3D Bloch Projection */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '16px',
                  backgroundColor: '#080c18',
                  borderRadius: '12px',
                  border: '1px solid #1e293b'
                }}
              >
                <svg width="220" height="220" viewBox="-110 -110 220 220" style={{ userSelect: 'none' }}>
                  {/* Sphere Outline */}
                  <circle cx="0" cy="0" r="85" fill="none" stroke="#1e293b" strokeWidth="1.5" />
                  {/* Equator Ellipse */}
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="85"
                    ry="25"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  {/* Z-Axis */}
                  <line x1="0" y1="95" x2="0" y2="-95" stroke="#475569" strokeWidth="1.5" />
                  {/* X-Axis */}
                  <line x1="-95" y1="0" x2="95" y2="0" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Pole Labels */}
                  <text x="5" y="-95" fill="#38bdf8" fontSize="11" fontFamily="monospace">
                    |0⟩ (+Z)
                  </text>
                  <text x="5" y="105" fill="#f43f5e" fontSize="11" fontFamily="monospace">
                    |1⟩ (-Z)
                  </text>
                  <text x="95" y="4" fill="#a855f7" fontSize="10" fontFamily="monospace">
                    |+⟩
                  </text>

                  {/* State Vector Arrow */}
                  <line
                    x1="0"
                    y1="0"
                    x2={blochX * 70}
                    y2={-blochZ * 70}
                    stroke="#00F2FE"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Vector Tip */}
                  <circle
                    cx={blochX * 70}
                    cy={-blochZ * 70}
                    r="5"
                    fill="#38bdf8"
                  />
                </svg>
              </div>

              {/* Coordinates Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#080c18',
                    borderRadius: '10px',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'inherit', fontWeight: 'bold' }}>
                    Bloch Coordinates for q[{selectedQubit}]:
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>X (Superposition):</span>
                    <span style={{ color: '#00F2FE', fontWeight: 'bold' }}>{blochX.toFixed(4)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Y (Phase):</span>
                    <span style={{ color: '#00F2FE', fontWeight: 'bold' }}>{blochY.toFixed(4)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Z (Ground/Excited):</span>
                    <span style={{ color: '#00F2FE', fontWeight: 'bold' }}>{blochZ.toFixed(4)}</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#080c18',
                    borderRadius: '10px',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ color: '#94a3b8', fontWeight: 'bold' }}>Projective Probabilities:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>P(|0⟩):</span>
                    <span style={{ color: '#34d399' }}>{(bit0Count * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>P(|1⟩):</span>
                    <span style={{ color: '#f87171' }}>{(bit1Count * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. State Evolution Stepper */}
        {activeTab === 'evolution' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#f1f5f9',
                    margin: 0
                  }}
                >
                  State Evolution Scrubber
                </h4>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Reconstruct state evolution gate-by-gate up to selected step index.
                </p>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleStep(evolutionStep - 1)}
                  disabled={evolutionStep <= 0}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    color: '#cbd5e1',
                    cursor: evolutionStep <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#0891b2',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'Pause' : 'Play Evolution'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStep(evolutionStep + 1)}
                  disabled={evolutionStep >= circuitDepth}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    color: '#cbd5e1',
                    cursor: evolutionStep >= circuitDepth ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Scrubber Slider */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#080c18',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono, monospace)'
                }}
              >
                <span style={{ color: '#00F2FE', fontWeight: 'bold' }}>
                  Step {evolutionStep} of {circuitDepth}
                </span>
                <span style={{ color: '#94a3b8' }}>
                  {evolutionStep === 0
                    ? 'Initial Ground State |0...0⟩'
                    : `Active Gate Depth: ${evolutionStep}`}
                </span>
              </div>
              <input
                id="evolution-step-slider"
                type="range"
                min="0"
                max={Math.max(1, circuitDepth)}
                value={evolutionStep}
                onChange={(e) => handleStep(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#00F2FE' }}
              />
            </div>
          </div>
        )}

        {/* 5. Circuit Details & Info */}
        {activeTab === 'details' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)'
            }}
          >
            <div
              style={{
                padding: '16px',
                backgroundColor: '#080c18',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <h5
                style={{
                  fontWeight: 'bold',
                  color: '#e2e8f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '11px',
                  margin: 0
                }}
              >
                Quantum Simulator Metadata
              </h5>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(30, 41, 59, 0.6)' }}>
                <span style={{ color: '#94a3b8' }}>Simulator Backend:</span>
                <span style={{ color: '#00F2FE', fontWeight: 'bold' }}>{result.backend?.id || 'qiskit-aer'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(30, 41, 59, 0.6)' }}>
                <span style={{ color: '#94a3b8' }}>Framework:</span>
                <span style={{ color: '#00F2FE', fontWeight: 'bold' }}>{result.backend?.framework || 'Qiskit'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(30, 41, 59, 0.6)' }}>
                <span style={{ color: '#94a3b8' }}>Simulation Mode:</span>
                <span style={{ color: '#f1f5f9' }}>{result.backend?.mode || 'statevector'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(30, 41, 59, 0.6)' }}>
                <span style={{ color: '#94a3b8' }}>Execution Time:</span>
                <span style={{ color: '#34d399', fontWeight: 'bold' }}>{result.execution_time_ms || result.executionTimeMs || 0} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#94a3b8' }}>Shots Sampled:</span>
                <span style={{ color: '#f1f5f9' }}>{result.shots}</span>
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                backgroundColor: '#080c18',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <h5
                style={{
                  fontWeight: 'bold',
                  color: '#e2e8f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '11px',
                  margin: 0
                }}
              >
                Circuit Topology & Metrics
              </h5>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(30, 41, 59, 0.6)' }}>
                <span style={{ color: '#94a3b8' }}>Qubit Width:</span>
                <span style={{ color: '#00F2FE', fontWeight: 'bold' }}>{numQubits} Qubits</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(30, 41, 59, 0.6)' }}>
                <span style={{ color: '#94a3b8' }}>Circuit Depth:</span>
                <span style={{ color: '#f1f5f9' }}>{circuitDepth}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(30, 41, 59, 0.6)' }}>
                <span style={{ color: '#94a3b8' }}>Operation Count:</span>
                <span style={{ color: '#f1f5f9' }}>{(circuit.gates || circuit.operations || []).length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: '#94a3b8' }}>Entanglement Detected:</span>
                <span style={{ color: (circuit.gates || []).some(g => g.type === 'CNOT' || g.type === 'CZ') ? '#f59e0b' : '#64748b', fontWeight: 'bold' }}>
                  {(circuit.gates || []).some(g => g.type === 'CNOT' || g.type === 'CZ') ? 'Yes (Multi-Qubit Entangler)' : 'No (Product State)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
