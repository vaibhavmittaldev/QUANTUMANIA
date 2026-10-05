import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Save,
  Lightbulb,
  Sparkles,
  X,
  LogOut,
  GitCompare,
  CheckCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { GateToolbox } from './GateToolbox';
import { CircuitCanvas } from './CircuitCanvas';
import { MonacoSyncEditor } from './MonacoSyncEditor';
import { ResultsVisualizer } from './ResultsVisualizer';
import { AITutorPanel } from './AITutorPanel';
import { SavedCircuitsModal } from './SavedCircuitsModal';
import { EndLabModal } from './EndLabModal';
import {
  CanonicalCircuit,
  SimulationOptions,
  SimulationResult,
  QuantumGate,
  CompareResult,
  SavedCircuit
} from '../../../types/circuit';
import { LabProblemDetail, LabValidationResponse } from '../../../types/learning';
import { quantumApi, adaptiveApi, learningApi } from '../../../services/api';
import '../styles/quantumLab.css';

const DEFAULT_BELL_CIRCUIT: CanonicalCircuit = {
  id: 'circ-bell-default',
  name: 'Superposition & Bell State',
  title: 'Superposition & Bell State',
  qubits: 2,
  numQubits: 2,
  classical_bits: 2,
  numClassicalBits: 2,
  depth: 2,
  gates: [
    { id: 'op-1', type: 'H', target: 0, targets: [0], step: 0, column: 0 },
    { id: 'op-2', type: 'CNOT', control: 0, controls: [0], target: 1, targets: [1], step: 1, column: 1 }
  ]
};

interface QuantumLabWorkspaceProps {
  initialCircuit?: CanonicalCircuit | null;
  initialTopic?: string;
  initialTask?: string;
  lessonId?: string;
  labProblemId?: string;
  onEndLab?: () => void;
}

export const QuantumLabWorkspace: React.FC<QuantumLabWorkspaceProps> = ({
  initialCircuit,
  initialTopic = 'Superposition and Bell State (|Φ⁺⟩)',
  initialTask = 'Use the Hadamard gate (H) on qubit q0 and CNOT (CX) to create a maximally entangled Bell state.',
  lessonId,
  labProblemId,
  onEndLab
}) => {
  const navigate = useNavigate();
  const [circuit, setCircuit] = useState<CanonicalCircuit>(initialCircuit || DEFAULT_BELL_CIRCUIT);
  const [history, setHistory] = useState<CanonicalCircuit[]>([initialCircuit || DEFAULT_BELL_CIRCUIT]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Simulation Options
  const [backend, setBackend] = useState<string>('Qiskit');
  const [simMode, setSimMode] = useState<string>('statevector');
  const [shots, setShots] = useState<number>(1024);
  const [noiseEnabled, setNoiseEnabled] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [comparing, setComparing] = useState<boolean>(false);

  // Simulation Results & Visualizations
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  // Modals & Panels
  const [showEndLabModal, setShowEndLabModal] = useState<boolean>(false);
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [savedCircuitsList, setSavedCircuitsList] = useState<SavedCircuit[]>([]);
  const [quickHintText, setQuickHintText] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Lab Practice State
  const [labProblem, setLabProblem] = useState<LabProblemDetail | null>(null);
  const [loadingLabProblem, setLoadingLabProblem] = useState<boolean>(false);
  const [validationResponse, setValidationResponse] = useState<LabValidationResponse | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [hintIndex, setHintIndex] = useState<number>(0);

  // Fetch Lab Problem when labProblemId is provided
  useEffect(() => {
    // Reset hint state immediately whenever labProblemId changes
    setQuickHintText(null);
    setHintIndex(0);

    if (!labProblemId) {
      setLabProblem(null);
      return;
    }
    let isMounted = true;
    setLoadingLabProblem(true);

    learningApi
      .getLabProblem(labProblemId)
      .then((data) => {
        if (!isMounted) return;
        setLabProblem(data);
        // Ensure hint content is hidden by default upon lab entry
        setQuickHintText(null);
        setHintIndex(0);

        // Setup clean starter circuit according to the problem requirements if no explicit initialCircuit
        if (!initialCircuit) {
          const reqGates = data.required_gates || [];
          const targetWires = data.expected_behavior?.target_wires as number[] | undefined;
          let numWires = 2;
          if (targetWires && targetWires.length > 0) {
            numWires = Math.max(...targetWires) + 1;
          } else if (reqGates.includes('CNOT') || reqGates.includes('CZ') || reqGates.includes('SWAP')) {
            numWires = 2;
          } else if (data.expected_concepts?.includes('multi_qubit')) {
            numWires = 3;
          } else {
            numWires = 1;
          }

          let starterCirc: CanonicalCircuit;
          if (data.starter_circuit_data && Object.keys(data.starter_circuit_data).length > 0) {
            starterCirc = data.starter_circuit_data as unknown as CanonicalCircuit;
          } else {
            starterCirc = {
              id: `circ-${data.id}`,
              name: data.title,
              title: data.title,
              qubits: numWires,
              numQubits: numWires,
              classical_bits: numWires,
              numClassicalBits: numWires,
              depth: 0,
              gates: []
            };
          }
          setCircuit(starterCirc);
          setHistory([starterCirc]);
          setHistoryIndex(0);
          setSimulationResult(null);
          setValidationResponse(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load lab problem:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingLabProblem(false);
      });

    return () => {
      isMounted = false;
    };
  }, [labProblemId, initialCircuit]);

  useEffect(() => {
    if (initialCircuit) {
      setCircuit(initialCircuit);
      setHistory([initialCircuit]);
      setHistoryIndex(0);
      setSimulationResult(null);
    }
  }, [initialCircuit]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleNextHint = () => {
    if (!labProblem || !labProblem.hints || labProblem.hints.length === 0) return;
    const nextIdx = (hintIndex + 1) % labProblem.hints.length;
    setHintIndex(nextIdx);
    setQuickHintText(`💡 Hint ${nextIdx + 1}/${labProblem.hints.length}: ${labProblem.hints[nextIdx]}`);
  };

  const handleToggleLabHint = () => {
    if (!labProblem || !labProblem.hints || labProblem.hints.length === 0) return;
    if (!quickHintText) {
      // Reveal the first hint (or current index)
      const currentIdx = hintIndex < labProblem.hints.length ? hintIndex : 0;
      setQuickHintText(`💡 Hint ${currentIdx + 1}/${labProblem.hints.length}: ${labProblem.hints[currentIdx]}`);
    } else {
      // If hint is already visible and there are multiple hints, cycle to next hint; if single hint, toggle closed
      if (labProblem.hints.length > 1) {
        const nextIdx = (hintIndex + 1) % labProblem.hints.length;
        setHintIndex(nextIdx);
        setQuickHintText(`💡 Hint ${nextIdx + 1}/${labProblem.hints.length}: ${labProblem.hints[nextIdx]}`);
      } else {
        setQuickHintText(null);
      }
    }
  };

  // Lab Validation Handler
  const handleValidateLab = async () => {
    if (!labProblem) {
      notify('No active lab problem to validate.');
      return;
    }
    setValidating(true);
    setValidationResponse(null);

    try {
      // Ensure simulation has been executed
      let currentSim = simulationResult;
      if (!currentSim) {
        const opts: SimulationOptions = {
          backend: backend === 'Qiskit' ? 'qiskit-aer' : backend.toLowerCase(),
          framework: backend,
          mode: simMode,
          shots,
          noise: { enabled: noiseEnabled, model: 'depolarizing', errorRate: 0.02 }
        };
        const simRes = await quantumApi.simulateCircuit(circuit, opts);
        if (simRes && simRes.success) {
          currentSim = simRes;
          setSimulationResult(simRes);
        }
      }

      const res = await learningApi.validateLabProblem(labProblem.id, {
        circuit: circuit as unknown as Record<string, unknown>,
        simulation_result: currentSim ? (currentSim as unknown as Record<string, unknown>) : null
      });

      setValidationResponse(res);

      if (res.is_valid) {
        setShowSuccessModal(true);
        notify(`🎉 Lab Problem Passed! +${res.xp_awarded} XP`);
        try {
          adaptiveApi.trackEvent({
            event_type: 'practice_completed',
            lesson_id: lessonId,
            topic_id: labProblem.topic_id,
            metadata: {
              problem_id: labProblem.id,
              problem_title: labProblem.title,
              xp_awarded: res.xp_awarded
            }
          });
        } catch {
          // Non-critical event tracking
        }
      } else {
        notify(`Validation incomplete: ${res.feedback}`);
      }
    } catch (err: any) {
      notify(`Validation error: ${err.message || 'Server error'}`);
    } finally {
      setValidating(false);
    }
  };

  // Canvas State changes
  const handleCircuitChange = (newCircuit: CanonicalCircuit | ((prev: CanonicalCircuit) => CanonicalCircuit)) => {
    setCircuit((prev) => {
      const next = typeof newCircuit === 'function' ? newCircuit(prev) : newCircuit;
      setHistory((prevH) => [...prevH.slice(0, historyIndex + 1), next]);
      setHistoryIndex((prevI) => prevI + 1);
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCircuit(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCircuit(history[historyIndex + 1]);
    }
  };

  // Run Simulation
  const handleRunSimulation = async (stepIndex?: number) => {
    setSimulating(true);
    setCompareResult(null);
    try {
      const opts: SimulationOptions = {
        backend: backend === 'Qiskit' ? 'qiskit-aer' : backend.toLowerCase(),
        framework: backend,
        mode: simMode,
        shots,
        noise: { enabled: noiseEnabled, model: 'depolarizing', errorRate: 0.02 },
        stepIndex
      };

      const res = await quantumApi.simulateCircuit(circuit, opts);
      if (res && res.success) {
        setSimulationResult(res);
        notify(`Simulation succeeded on ${backend} in ${res.execution_time_ms || res.executionTimeMs || 0}ms!`);

        // Record learner activity event
        try {
          adaptiveApi.trackEvent({
            event_type: 'circuit_simulated',
            lesson_id: lessonId,
            metadata: {
              qubits: circuit.qubits,
              gate_count: (circuit.gates || []).length,
              backend
            }
          });
        } catch {
          // Non-critical event tracking
        }

        setTimeout(() => {
          document.getElementById('simulation-results-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        notify(`Simulation error: ${res?.error || 'Unknown simulation failure'}`);
      }
    } catch (err: any) {
      notify(`Execution failure: ${err.message || 'Server error'}`);
    } finally {
      setSimulating(false);
    }
  };

  // Compare Frameworks
  const handleCompare = async () => {
    setComparing(true);
    try {
      const res = await quantumApi.compareFrameworks(circuit, ['Qiskit', 'PennyLane', 'Cirq'], shots, 'statevector');
      if (res) {
        setCompareResult(res);
        notify('Cross-Framework Comparison completed!');
      }
    } catch (err: any) {
      notify(`Comparison error: ${err.message || 'Failed to compare backends'}`);
    } finally {
      setComparing(false);
    }
  };

  // Save Circuit
  const handleSaveCircuit = async () => {
    try {
      const res = await quantumApi.saveCircuit({
        circuit,
        title: circuit.title || circuit.name || 'My Quantum Circuit'
      });
      if (res && res.success) {
        notify('Circuit saved to your profile!');
      } else {
        notify('Saved locally.');
      }
    } catch (err: any) {
      notify(`Save failed: ${err.message || 'Error'}`);
    }
  };

  // Open Circuit Modal
  const handleOpenModal = async () => {
    setShowOpenModal(true);
    try {
      const res = await quantumApi.getSavedCircuits();
      if (res && Array.isArray(res)) {
        setSavedCircuitsList(res);
      }
    } catch (err) {
      console.error('Failed to get saved circuits:', err);
    }
  };

  // Export OpenQASM
  const handleExportQASM = async () => {
    try {
      const res = await quantumApi.toOpenQasm(circuit);
      if (res && res.qasm) {
        const blob = new Blob([res.qasm], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = (circuit.title || circuit.name || 'circuit').replace(/\s+/g, '_');
        a.download = `${filename}.qasm`;
        a.click();
        URL.revokeObjectURL(url);
        notify('OpenQASM exported successfully!');
      } else {
        notify('Export error: Unable to generate QASM');
      }
    } catch (err: any) {
      notify(`Export failed: ${err.message}`);
    }
  };

  const handleEndLabSession = () => {
    handleSaveCircuit();
    setShowEndLabModal(false);
    if (onEndLab) {
      onEndLab();
    } else {
      navigate('/app/learn');
    }
  };

  return (
    <div className="quantumlab-workspace">
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: '#0d1428',
            border: '1px solid rgba(6, 182, 212, 0.6)',
            color: '#67e8f9',
            padding: '10px 16px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono, monospace)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={16} color="#00F2FE" />
          <span>{notification}</span>
        </div>
      )}

      {/* TOP MENU BAR */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(8, 51, 68, 0.7)',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)' }}>
          <button
            type="button"
            onClick={() => handleCircuitChange({ ...DEFAULT_BELL_CIRCUIT, id: `circ-${Date.now()}` })}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#cbd5e1',
              border: '1px solid #1e293b',
              cursor: 'pointer'
            }}
          >
            New
          </button>
          <button
            id="btn-open-circuit"
            type="button"
            onClick={handleOpenModal}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#cbd5e1',
              border: '1px solid #1e293b',
              cursor: 'pointer'
            }}
          >
            Open
          </button>
          <button
            id="btn-save-circuit"
            type="button"
            onClick={handleSaveCircuit}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#cbd5e1',
              border: '1px solid #1e293b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Save size={12} color="#00F2FE" />
            <span>Save</span>
          </button>
          <button
            id="btn-export-qasm"
            type="button"
            onClick={handleExportQASM}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#cbd5e1',
              border: '1px solid #1e293b',
              cursor: 'pointer'
            }}
          >
            Export QASM
          </button>

          <div style={{ height: '16px', width: '1px', backgroundColor: '#1e293b', margin: '0 4px' }} />

          {/* Quick Contextual Hint */}
          <button
            id="btn-hints"
            type="button"
            onClick={
              labProblem && labProblem.hints && labProblem.hints.length > 0
                ? handleToggleLabHint
                : () =>
                    setQuickHintText(
                      quickHintText
                        ? null
                        : '💡 Quick Hint: Applying Hadamard H on q0 followed by CX(q0, q1) entangles them into (|00⟩ + |11⟩)/√2.'
                    )
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(120, 53, 15, 0.4)',
              color: '#fde68a',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              cursor: 'pointer'
            }}
            title={
              labProblem && labProblem.hints?.length
                ? quickHintText
                  ? `Next Hint (${hintIndex + 1}/${labProblem.hints.length})`
                  : `Show Hint (1/${labProblem.hints.length})`
                : 'Toggle Quick Hint'
            }
          >
            <Lightbulb size={12} color="#fbbf24" />
            <span>
              Hints
              {labProblem && labProblem.hints?.length && quickHintText
                ? ` (${hintIndex + 1}/${labProblem.hints.length})`
                : ''}
            </span>
          </button>
        </div>

        {/* End Lab Action */}
        <button
          id="btn-end-lab"
          type="button"
          onClick={() => setShowEndLabModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            backgroundColor: 'rgba(136, 19, 55, 0.5)',
            color: '#fecdd3',
            border: '1px solid rgba(244, 63, 94, 0.5)',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          <LogOut size={13} />
          <span>END LAB</span>
        </button>
      </div>

      {/* Quick Hint Popover */}
      {quickHintText && (
        <div
          id="panel-quick-hint"
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(120, 53, 15, 0.35)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#fde68a',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
            <span>{quickHintText}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {labProblem && labProblem.hints && labProblem.hints.length > 1 && (
              <button
                type="button"
                id="btn-next-hint"
                onClick={handleNextHint}
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.25)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '4px',
                  color: '#fef08a',
                  padding: '2px 8px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Next Hint
              </button>
            )}
            <button
              type="button"
              id="btn-close-hint"
              onClick={() => setQuickHintText(null)}
              style={{ color: '#fbbf24', cursor: 'pointer', padding: '2px', background: 'none', border: 'none' }}
              aria-label="Close hint"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* CURRENT TOPIC / TASK BAR */}
      <div
        style={{
          backgroundColor: '#0a0f1d',
          border: labProblem ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(8, 51, 68, 0.7)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: labProblem ? '0 4px 20px rgba(0, 242, 254, 0.12)' : '0 4px 16px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', flexWrap: 'wrap' }}>
            <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>Current Topic:</span>
            <span style={{ color: '#00F2FE', fontWeight: 'bold' }}>
              {labProblem ? (labProblem.topic_id ? labProblem.topic_id.replace(/_/g, ' ').toUpperCase() : initialTopic) : initialTopic}
            </span>
            {labProblem && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 242, 254, 0.15)',
                  color: '#00F2FE',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                LAB PRACTICE: {labProblem.difficulty.toUpperCase()}
              </span>
            )}
            {lessonId && (
              <button
                onClick={() => navigate(`/app/learn/lessons/${lessonId}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '11px',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                &larr; Return to Lesson
              </button>
            )}
          </div>
          <div style={{ marginTop: '4px' }}>
            <p style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 600, margin: '2px 0 2px 0' }}>
              <strong style={{ color: '#cbd5e1' }}>Task:</strong> {loadingLabProblem ? 'Loading Lab Task...' : (labProblem ? labProblem.title : initialTask)}
            </p>
            {labProblem?.objective && (
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                {labProblem.objective}
              </p>
            )}
          </div>
        </div>

        {/* Progress Stages */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontFamily: 'var(--font-mono, monospace)' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(8, 51, 68, 0.8)',
              color: '#38bdf8',
              border: '1px solid #0369a1'
            }}
          >
            1 Learn
          </span>
          <span style={{ color: '#475569' }}>&rarr;</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(6, 182, 212, 0.2)',
              color: '#00F2FE',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              fontWeight: 'bold',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.25)'
            }}
          >
            2 Build
          </span>
          <span style={{ color: '#475569' }}>&rarr;</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#0f172a',
              color: '#94a3b8',
              border: '1px solid #1e293b'
            }}
          >
            3 Simulate
          </span>
          <span style={{ color: '#475569' }}>&rarr;</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#0f172a',
              color: '#94a3b8',
              border: '1px solid #1e293b'
            }}
          >
            4 Analyze
          </span>
        </div>
      </div>

      {/* MAIN WORKSPACE: Toolbox + Canvas + Monaco */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '12px',
          minHeight: '480px',
          alignItems: 'stretch'
        }}
      >
        {/* Gate Toolbox */}
        <GateToolbox
          onSelectGate={(gate) => {
            handleCircuitChange((prevCircuit) => {
              const currentOps = prevCircuit.gates || prevCircuit.operations || [];
              const currentDepth = prevCircuit.depth !== undefined ? prevCircuit.depth : currentOps.reduce((max, g) => Math.max(max, (g.step ?? g.column ?? 0) + 1), 0);
              
              const newOp: QuantumGate = {
                id: `gate-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: gate.symbol as any,
                target: 0,
                targets: [0],
                step: currentDepth,
                column: currentDepth
              };

              if (gate.symbol === 'CX' || gate.symbol === 'CNOT') {
                newOp.type = 'CNOT';
                newOp.control = 0;
                newOp.controls = [0];
                newOp.target = 1;
                newOp.targets = [1];
              } else if (gate.symbol === 'CZ') {
                newOp.type = 'CZ';
                newOp.control = 0;
                newOp.controls = [0];
                newOp.target = 1;
                newOp.targets = [1];
              } else if (gate.symbol === 'SWAP') {
                newOp.type = 'SWAP';
                newOp.target = 0;
                newOp.targets = [0, 1];
              } else if (['RX', 'RY', 'RZ'].includes(gate.symbol)) {
                newOp.params = { theta: Math.PI / 2 };
                newOp.parameters = { theta: gate.defaultParam || 'pi/2' };
              } else if (gate.symbol === 'MEASURE') {
                newOp.type = 'MEASURE';
              }

              return {
                ...prevCircuit,
                gates: [...currentOps, newOp],
                operations: [...currentOps, newOp],
                depth: currentDepth + 1
              };
            });
          }}
        />

        {/* Circuit Canvas */}
        <CircuitCanvas
          circuit={circuit}
          onChange={handleCircuitChange}
          undo={handleUndo}
          redo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />

        {/* Monaco Editor */}
        <MonacoSyncEditor
          circuit={circuit}
          onCodeSyncedCircuit={handleCircuitChange}
        />
      </div>

      {/* RUN & CONFIGURE BAR */}
      <div
        style={{
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(8, 51, 68, 0.7)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)' }}>
          {/* Framework Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Backend:</span>
            <select
              value={backend}
              onChange={(e) => setBackend(e.target.value)}
              style={{
                backgroundColor: '#080c18',
                border: '1px solid #1e293b',
                color: '#00F2FE',
                borderRadius: '8px',
                padding: '4px 10px',
                outline: 'none'
              }}
            >
              <option value="Qiskit">Qiskit Aer (AerSimulator)</option>
              <option value="Cirq">Cirq (cirq.Simulator)</option>
              <option value="PennyLane">PennyLane (default.qubit)</option>
              <option value="qBraid">qBraid Quantum Cloud</option>
            </select>
          </div>

          {/* Simulation Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Mode:</span>
            <select
              value={simMode}
              onChange={(e) => setSimMode(e.target.value)}
              style={{
                backgroundColor: '#080c18',
                border: '1px solid #1e293b',
                color: '#f1f5f9',
                borderRadius: '8px',
                padding: '4px 10px',
                outline: 'none'
              }}
            >
              <option value="statevector">Statevector (Exact)</option>
              <option value="measurement">Measurement (Shots)</option>
              <option value="noisy">Noisy Depolarizing</option>
            </select>
          </div>

          {/* Shots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Shots:</span>
            <select
              value={shots}
              onChange={(e) => setShots(parseInt(e.target.value))}
              style={{
                backgroundColor: '#080c18',
                border: '1px solid #1e293b',
                color: '#f1f5f9',
                borderRadius: '8px',
                padding: '4px 10px',
                outline: 'none'
              }}
            >
              <option value="256">256</option>
              <option value="1024">1024</option>
              <option value="4096">4096</option>
            </select>
          </div>

          {/* Noise Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#cbd5e1' }}>
            <input
              type="checkbox"
              checked={noiseEnabled}
              onChange={(e) => setNoiseEnabled(e.target.checked)}
              style={{ accentColor: '#00F2FE' }}
            />
            <span>Noise Model</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Cross-framework compare */}
          <button
            type="button"
            onClick={handleCompare}
            disabled={comparing || simulating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              color: '#cbd5e1',
              fontSize: '11px',
              fontWeight: 600,
              cursor: comparing || simulating ? 'not-allowed' : 'pointer'
            }}
            title="Simulate equivalent circuit on Qiskit, PennyLane, and Cirq and compare distributions"
          >
            <GitCompare size={14} color="#c084fc" />
            <span>{comparing ? 'Comparing...' : 'Compare Backends'}</span>
          </button>

          {/* Validate Lab Task Button (Shown prominently when lab problem active) */}
          {labProblem && (
            <button
              id="btn-validate-lab"
              type="button"
              onClick={handleValidateLab}
              disabled={validating || simulating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: validating || simulating ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
                opacity: validating ? 0.7 : 1,
                border: 'none'
              }}
              title="Validate your circuit against the lab problem objectives and simulation results"
            >
              <CheckCircle size={15} />
              <span>{validating ? 'Validating...' : 'Validate Solution'}</span>
            </button>
          )}

          {/* Run Circuit */}
          <button
            id="btn-run-circuit"
            type="button"
            onClick={() => handleRunSimulation()}
            disabled={simulating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 24px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #00F2FE 0%, #2563eb 100%)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: simulating ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)',
              opacity: simulating ? 0.6 : 1
            }}
          >
            <Play size={14} fill="currentColor" />
            <span>{simulating ? 'Simulating on Aer...' : 'Run Circuit'}</span>
          </button>
        </div>
      </div>

      {/* Validation Feedback Banner (when attempted and incomplete) */}
      {validationResponse && !validationResponse.is_valid && (
        <div
          id="validation-feedback-card"
          style={{
            padding: '14px 18px',
            backgroundColor: 'rgba(127, 29, 29, 0.35)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px',
            color: '#fca5a5',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <AlertCircle size={16} color="#ef4444" />
              <span>Validation Incomplete — Check your circuit requirements:</span>
            </div>
            <button
              onClick={() => setValidationResponse(null)}
              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#fecaca', lineHeight: 1.5 }}>
            {validationResponse.feedback}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
            {validationResponse.checks.map((chk, i) => (
              <span
                key={i}
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono, monospace)',
                  backgroundColor: chk.passed ? 'rgba(6, 78, 59, 0.6)' : 'rgba(127, 29, 29, 0.6)',
                  border: chk.passed ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
                  color: chk.passed ? '#34d399' : '#f87171'
                }}
              >
                {chk.passed ? '✓' : '✗'} {chk.name}: {chk.details}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cross-Framework Comparison Panel (When triggered) */}
      {compareResult && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#0a0f1d',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              borderBottom: '1px solid #1e293b'
            }}
          >
            <h4
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#c084fc',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-mono, monospace)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                margin: 0
              }}
            >
              <GitCompare size={16} color="#c084fc" />
              Cross-Framework Numerical Consistency Report
            </h4>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 'bold',
                backgroundColor: compareResult.consistent ? 'rgba(6, 78, 59, 0.6)' : 'rgba(120, 53, 15, 0.6)',
                color: compareResult.consistent ? '#34d399' : '#fbbf24',
                border: compareResult.consistent ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)'
              }}
            >
              {compareResult.consistent ? '✓ FRAMEWORK CONSISTENCY VERIFIED (Δ < 0.05)' : 'DISCREPANCY DETECTED'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono, monospace)' }}>
            {['Qiskit', 'PennyLane', 'Cirq'].map((fw) => {
              const res = compareResult.results?.[fw];
              return (
                <div
                  key={fw}
                  style={{
                    padding: '12px',
                    backgroundColor: '#080c18',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#00F2FE', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{fw}</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{res?.execution_time_ms || res?.executionTimeMs || 0}ms</span>
                  </div>
                  {res?.probabilities && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10px', color: '#94a3b8' }}>
                      {Object.entries(res.probabilities).map(([st, p]: any) => (
                        <div key={st} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>|{st}⟩:</span>
                          <span style={{ color: '#f1f5f9' }}>{(p * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESULTS & VISUALIZATIONS + SEPARATE AI QUANTUM TUTOR */}
      {simulationResult && (
        <div
          id="simulation-results-section"
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'flex-start'
          }}
        >
          {/* Results Panel */}
          <div style={{ flex: 1, minWidth: '320px', width: '100%' }}>
            <ResultsVisualizer
              result={simulationResult}
              circuit={circuit}
              onStepChange={(stepIdx) => handleRunSimulation(stepIdx)}
            />
          </div>

          {/* AI Quantum Tutor Panel (SEPARATE adjacent panel from Results!) */}
          <AITutorPanel
            currentTopic={labProblem ? (labProblem.topic_id ? labProblem.topic_id.replace(/_/g, ' ').toUpperCase() : initialTopic) : initialTopic}
            currentTask={labProblem ? `${labProblem.title}: ${labProblem.objective}` : initialTask}
            circuit={circuit}
            simulationResult={simulationResult}
            labProblem={labProblem}
            validationFeedback={validationResponse && !validationResponse.is_valid ? validationResponse.feedback : null}
          />
        </div>
      )}

      {/* Open Saved Circuit Modal */}
      <SavedCircuitsModal
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        circuits={savedCircuitsList}
        onSelectCircuit={(loadedCircuit, title) => {
          handleCircuitChange(loadedCircuit);
          notify(`Loaded circuit '${title}'!`);
        }}
      />

      {/* End Lab Confirmation Modal */}
      <EndLabModal
        isOpen={showEndLabModal}
        onClose={() => setShowEndLabModal(false)}
        onConfirm={handleEndLabSession}
      />

      {/* Lab Success State Modal */}
      {showSuccessModal && (
        <div
          id="lab-success-modal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(4, 8, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#0a1020',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  flexShrink: 0
                }}
              >
                <CheckCircle size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9' }}>
                  ✓ Lab Practice Completed!
                </h3>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                  +{validationResponse?.xp_awarded || 50} XP Awarded to your profile
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
              {validationResponse?.explanation || labProblem?.explanation || 'Great job! Your circuit successfully satisfied all quantum state and gate requirements.'}
            </p>

            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)'
              }}
            >
              {validationResponse?.checks.map((chk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
                  <span>✓</span>
                  <span>{chk.name}: {chk.details}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Inspect Circuit
              </button>

              {validationResponse?.next_problem_id && (
                <button
                  type="button"
                  id="btn-next-lab"
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate(
                      `/app/quantum-lab?topic=${encodeURIComponent(labProblem?.topic_id || '')}&lesson_id=${lessonId || ''}&lab_problem_id=${validationResponse.next_problem_id}`
                    );
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 242, 254, 0.15)',
                    border: '1px solid rgba(0, 242, 254, 0.5)',
                    color: '#00F2FE',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Next Lab Task &rarr;
                </button>
              )}

              <button
                type="button"
                id="btn-continue-learning"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (lessonId) {
                    navigate(`/app/learn/lessons/${lessonId}`);
                  } else {
                    navigate('/app/learn');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                }}
              >
                <span>Continue Learning</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
