/**
 * QUANTUMANIA - Interactive Simulation Results & Visualization Panel
 * Phase 4: Quantum Simulator
 * Displays execution summary, measurement histograms, probability distributions, statevector, and Bloch vectors.
 */

import React, { useState } from 'react';
import { SimulationResult } from '../../../types/circuit';
import {
  Activity,
  BarChart2,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass
} from 'lucide-react';


interface SimulationResultsPanelProps {
  result: SimulationResult | null;
  isStale: boolean;
  onClear: () => void;
  onRerun: () => void;
}

type TabType = 'histogram' | 'probabilities' | 'statevector' | 'bloch';

export const SimulationResultsPanel: React.FC<SimulationResultsPanelProps> = ({
  result,
  isStale,
  onClear,
  onRerun
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('histogram');
  const [hideZeroStates, setHideZeroStates] = useState<boolean>(true);

  if (!result) {
    return null;
  }

  // Handle Simulation Error
  if (!result.success) {
    return (
      <div
        className="card"
        style={{
          padding: '1.25rem',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Simulation Failed</h3>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            Dismiss
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          {result.error || 'The circuit failed to simulate. Please check gate connections and parameters.'}
        </p>
      </div>
    );
  }

  // Extract Basis States for Display
  const allProbabilityEntries = Object.entries(result.probabilities || {});
  const filteredProbabilities = hideZeroStates
    ? allProbabilityEntries.filter(([_, p]) => p > 0.0001)
    : allProbabilityEntries;

  const totalShots = result.shots || 1;
  const countsEntries = Object.entries(result.counts || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.98) 0%, rgba(13, 17, 30, 0.95) 100%)',
        border: isStale ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-medium)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Top Banner: Header, Status & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid var(--accent-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)'
            }}
          >
            <Activity size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Classical Simulation Results
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Deterministic statevector evolution &amp; multi-shot sampling
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isStale ? (
            <span
              className="badge badge-amber"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            >
              <AlertTriangle size={12} /> Stale (Circuit Changed)
            </span>
          ) : (
            <span
              className="badge badge-emerald"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            >
              <CheckCircle2 size={12} /> Up to Date
            </span>
          )}

          {isStale && (
            <button
              type="button"
              onClick={onRerun}
              className="btn btn-primary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            >
              Re-run Simulation
            </button>
          )}

          <button
            type="button"
            onClick={onClear}
            className="btn btn-secondary"
            title="Clear simulation results (preserves circuit)"
            aria-label="Clear simulation results"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            <RotateCcw size={13} style={{ marginRight: '0.3rem' }} /> Clear Results
          </button>
        </div>
      </div>

      {/* Stale Warning Notice */}
      {isStale && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--accent-amber)',
            fontSize: '0.8rem'
          }}
        >
          <AlertTriangle size={15} />
          <span>Circuit changed since the last simulation. Run the circuit again to update results.</span>
        </div>
      )}

      {/* Execution Summary Metrics Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          padding: '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Allocated Qubits
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {result.qubits} Qubit{result.qubits > 1 ? 's' : ''} (2<sup>{result.qubits}</sup> = {1 << result.qubits} states)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Circuit Depth
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {result.depth} Slice{result.depth !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Gates
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {result.operationCount} Operation{result.operationCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Measurement Shots
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {result.shots.toLocaleString()} Shots
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Execution Time
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={13} /> {result.execution_time_ms} ms
          </span>
        </div>
      </div>

      {/* Educational Pedagogical Explanation Callout */}
      {result.explanation && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: '0.85rem'
          }}
        >
          <Sparkles size={18} color="var(--accent-purple)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>
              Educational Insight
            </span>
            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {result.explanation}
            </span>
          </div>
        </div>
      )}

      {/* Visualization Tab Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '0.5rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('histogram')}
          className={`btn ${activeTab === 'histogram' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
        >
          <BarChart2 size={14} style={{ marginRight: '0.3rem' }} /> Measurement Counts ({countsEntries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('probabilities')}
          className={`btn ${activeTab === 'probabilities' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
        >
          <Activity size={14} style={{ marginRight: '0.3rem' }} /> Probabilities ({filteredProbabilities.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('statevector')}
          className={`btn ${activeTab === 'statevector' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
        >
          <Layers size={14} style={{ marginRight: '0.3rem' }} /> State Vector ({result.statevector.length})
        </button>

        {result.bloch_vectors && result.bloch_vectors.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('bloch')}
            className={`btn ${activeTab === 'bloch' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            <Compass size={14} style={{ marginRight: '0.3rem' }} /> Bloch Coordinates ({result.bloch_vectors.length})
          </button>
        )}

        {(activeTab === 'probabilities' || activeTab === 'statevector') && result.qubits > 1 && (
          <label
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={hideZeroStates}
              onChange={(e) => setHideZeroStates(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Hide zero-probability states
          </label>
        )}
      </div>

      {/* Tab 1: Measurement Histogram */}
      {activeTab === 'histogram' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Empirical observation frequencies sampled over <strong>{result.shots} shots</strong>:
            </span>
          </div>

          {countsEntries.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No measurements recorded.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                maxHeight: '340px',
                overflowY: 'auto',
                paddingRight: '0.25rem'
              }}
            >
              {countsEntries.map(([basis, count]) => {
                const fraction = count / totalShots;
                const percentage = (fraction * 100).toFixed(1);

                return (
                  <div
                    key={basis}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '70px 1fr 110px',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.4rem 0.6rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: 'var(--accent-cyan)'
                      }}
                    >
                      |{basis}⟩
                    </span>

                    {/* Progress Bar Container */}
                    <div
                      role="progressbar"
                      aria-valuenow={count}
                      aria-valuemin={0}
                      aria-valuemax={totalShots}
                      aria-label={`State |${basis}⟩ observation bar`}
                      style={{
                        height: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease-out'
                        }}
                      />
                    </div>

                    <div
                      style={{
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <strong>{count}</strong> ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Accessible Data Summary Table for Screen Readers */}
          <details style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            <summary style={{ cursor: 'pointer' }}>View tabular data (accessible table)</summary>
            <table
              style={{
                width: '100%',
                marginTop: '0.5rem',
                borderCollapse: 'collapse',
                textAlign: 'left',
                border: '1px solid var(--border-light)'
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                  <th style={{ padding: '0.4rem', borderBottom: '1px solid var(--border-light)' }}>Basis State</th>
                  <th style={{ padding: '0.4rem', borderBottom: '1px solid var(--border-light)' }}>Observation Count</th>
                  <th style={{ padding: '0.4rem', borderBottom: '1px solid var(--border-light)' }}>Fraction</th>
                </tr>
              </thead>
              <tbody>
                {countsEntries.map(([b, c]) => (
                  <tr key={b} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.4rem', fontFamily: 'monospace' }}>|{b}⟩</td>
                    <td style={{ padding: '0.4rem', fontFamily: 'monospace' }}>{c}</td>
                    <td style={{ padding: '0.4rem', fontFamily: 'monospace' }}>
                      {((c / totalShots) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}

      {/* Tab 2: Theoretical Probability Distribution */}
      {activeTab === 'probabilities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Exact mathematical probability distribution |α<sub>i</sub>|<sup>2</sup>:
          </span>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxHeight: '340px',
              overflowY: 'auto',
              paddingRight: '0.25rem'
            }}
          >
            {filteredProbabilities.map(([basis, p]) => {
              const pct = (p * 100).toFixed(2);
              const empiricalCount = result.counts[basis] || 0;
              const empiricalPct = ((empiricalCount / totalShots) * 100).toFixed(1);

              return (
                <div
                  key={basis}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 1fr 140px',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: p > 0 ? 'var(--accent-purple)' : 'var(--text-muted)'
                    }}
                  >
                    |{basis}⟩
                  </span>

                  <div
                    style={{
                      height: '18px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #7c3aed 0%, #ec4899 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease-out'
                      }}
                    />
                  </div>

                  <div
                    style={{
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <strong>{pct}%</strong>
                    {result.shots > 0 && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                        (emp: {empiricalPct}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: State Vector Amplitudes Table */}
      {activeTab === 'statevector' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Full state-vector complex amplitudes |ψ⟩ = ∑ α<sub>k</sub> |k⟩:
          </span>

          <div
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-light)' }}>Basis</th>
                  <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-light)' }}>Real</th>
                  <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-light)' }}>Imag (i)</th>
                  <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-light)' }}>|α|² (Prob)</th>
                  <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-light)' }}>Phase</th>
                </tr>
              </thead>
              <tbody>
                {result.statevector
                  .filter((entry) => !hideZeroStates || entry.magnitude > 0.0001)
                  .map((entry) => {
                    const phaseDeg = ((entry.phase_rad * 180) / Math.PI).toFixed(1);
                    return (
                      <tr
                        key={entry.basis}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          fontFamily: 'monospace',
                          backgroundColor:
                            entry.magnitude > 0 ? 'rgba(99, 102, 241, 0.04)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '0.45rem 0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          |{entry.basis}⟩
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-primary)' }}>
                          {entry.real >= 0 ? `+${entry.real.toFixed(4)}` : entry.real.toFixed(4)}
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-primary)' }}>
                          {entry.imag >= 0 ? `+${entry.imag.toFixed(4)}` : entry.imag.toFixed(4)}i
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600, color: 'var(--accent-purple)' }}>
                          {(entry.magnitude * 100).toFixed(1)}%
                        </td>
                        <td style={{ padding: '0.45rem 0.75rem', color: 'var(--text-muted)' }}>
                          {entry.phase_rad.toFixed(3)} rad ({phaseDeg}°)
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Reduced Bloch Vectors */}
      {activeTab === 'bloch' && result.bloch_vectors && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Single-qubit marginal expectation values &lt;σ<sub>x</sub>&gt;, &lt;σ<sub>y</sub>&gt;, &lt;σ<sub>z</sub>&gt;:
          </span>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem'
            }}
          >
            {result.bloch_vectors.map((bv) => {
              const radius = Math.sqrt(bv.x * bv.x + bv.y * bv.y + bv.z * bv.z);
              const isEntangled = radius < 0.95;

              return (
                <div
                  key={bv.qubit}
                  style={{
                    padding: '0.85rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      Qubit q{bv.qubit}
                    </span>
                    <span
                      className={`badge ${isEntangled ? 'badge-amber' : 'badge-emerald'}`}
                      style={{ fontSize: '0.68rem' }}
                    >
                      {isEntangled ? 'Entangled (Mixed)' : 'Pure Separable'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>&lt;X&gt;</span>
                      <span style={{ color: 'var(--text-primary)' }}>{bv.x >= 0 ? `+${bv.x.toFixed(4)}` : bv.x.toFixed(4)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>&lt;Y&gt;</span>
                      <span style={{ color: 'var(--text-primary)' }}>{bv.y >= 0 ? `+${bv.y.toFixed(4)}` : bv.y.toFixed(4)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>&lt;Z&gt;</span>
                      <span style={{ color: 'var(--text-primary)' }}>{bv.z >= 0 ? `+${bv.z.toFixed(4)}` : bv.z.toFixed(4)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Radius |r|</span>
                      <span style={{ color: isEntangled ? 'var(--accent-amber)' : 'var(--accent-emerald)', fontWeight: 700 }}>
                        {radius.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
