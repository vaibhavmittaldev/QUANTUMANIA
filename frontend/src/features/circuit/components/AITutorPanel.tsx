import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Lightbulb,
  Bot,
  X
} from 'lucide-react';
import { tutorApi, quantumApi } from '../../../services/api';
import { CanonicalCircuit, SimulationResult } from '../../../types/circuit';
import { LabProblemDetail } from '../../../types/learning';
import { TutorMode } from '../../../types/tutor';

interface AITutorPanelProps {
  currentTopic?: string;
  currentTask?: string;
  circuit?: CanonicalCircuit;
  simulationResult?: SimulationResult | null;
  labProblem?: LabProblemDetail | null;
  validationFeedback?: string | null;
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  currentTopic = 'Superposition and Hadamard Gate',
  currentTask = 'Create a superposition state using H on q0.',
  circuit,
  simulationResult,
  labProblem,
  validationFeedback
}) => {
  const [query, setQuery] = useState('');
  const [actionMode, setActionMode] = useState<string>('explain');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; source?: string }>
  >([
    {
      sender: 'ai',
      text: labProblem
        ? `Hello! I am your **AI Quantum Tutor**. I am monitoring your live workspace for the lab challenge **${labProblem.title}** (${currentTopic}).\n\nTask: ${labProblem.objective}\n\nAsk me for hints, concept explanations, or help diagnosing your circuit!`
        : `Hello! I am your **AI Quantum Tutor**. I am analyzing your live quantum circuit and simulation results for **${currentTopic}**.\n\nAsk me anything about superposition, entanglement, gate operations, or mathematical formulations!`
    }
  ]);
  const [quickHint, setQuickHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const suggestedQuestions = labProblem
    ? [
        `How do I create the required state for ${labProblem.title}?`,
        'Why did my circuit fail validation?',
        'Explain the mathematical transformation happening in this circuit',
        'What physical quantum property is being demonstrated here?'
      ]
    : [
        'Why do we get 00 and 11 in the Bell state?',
        'Explain how the Hadamard gate works intuitively',
        'Show the mathematical statevector derivation',
        'What physical operation does the CNOT gate perform?'
      ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || query;
    if (!textToSend.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    if (!questionText) setQuery('');
    setLoading(true);

    try {
      // Map action mode to TutorMode
      let tutorMode: TutorMode = 'ask';
      if (actionMode === 'explain') tutorMode = 'explain';
      else if (actionMode === 'debug') tutorMode = 'guide';
      else if (actionMode === 'result') tutorMode = 'analyze';

      const res = await tutorApi.query({
        mode: tutorMode,
        message: textToSend,
        lesson_context: {
          title: currentTopic,
          topic: currentTopic,
          objectives: labProblem
            ? [
                `Lab Challenge: ${labProblem.title}`,
                `Objective: ${labProblem.objective}`,
                ...(labProblem.instructions || []),
                ...(validationFeedback ? [`Recent Validation Error/Feedback: ${validationFeedback}`] : [])
              ]
            : currentTask
            ? [currentTask]
            : []
        },
        circuit_context: circuit
          ? {
              qubits: circuit.qubits || 2,
              depth: circuit.depth || 0,
              gate_count: (circuit.gates || []).length,
              gates_summary: (circuit.gates || []).map(
                (g) => `${g.type} on q${g.target ?? g.targets?.[0] ?? 0}`
              ),
              circuit: circuit as any
            }
          : undefined,
        simulation_context: simulationResult
          ? {
              has_simulation: true,
              is_stale: false,
              shots: simulationResult.shots,
              probabilities: simulationResult.probabilities,
              counts: simulationResult.counts
            }
          : undefined
      });

      if (res && res.message) {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: res.message, source: 'Quantum Tutor Grounded' }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: 'I analyzed your circuit. Applying the quantum operations sequentially transforms the state vector according to unitary evolution.'
          }
        ]);
      }
    } catch (err: any) {
      // Offline fallback
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `**Notice:** Unable to connect to cloud AI backend (${err.message || 'Offline'}).\n\n*Pedagogical analysis:* Your circuit has ${
            circuit?.qubits || 2
          } qubits. Ensure gates are applied before measurements for proper state transformation.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGetHint = async () => {
    setHintLoading(true);
    try {
      const res = await quantumApi.getHint({
        topic: currentTopic,
        task: currentTask,
        circuit
      });
      if (res && res.hint) {
        setQuickHint(res.hint);
      } else {
        setQuickHint('Quick Hint: Applying Hadamard H on q0 followed by CX(q0, q1) entangles them into (|00⟩ + |11⟩)/√2.');
      }
    } catch {
      setQuickHint('Quick Hint: Review your circuit: check the control qubit basis state before entangling.');
    } finally {
      setHintLoading(false);
    }
  };

  return (
    <aside
      style={{
        width: '340px',
        backgroundColor: '#0a0f1d',
        border: '1px solid rgba(8, 51, 68, 0.7)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '480px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        flexShrink: 0
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: '#080c18',
          borderBottom: '1px solid #1e293b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={14} color="#c084fc" />
          </div>
          <div>
            <h4
              style={{
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#f1f5f9',
                margin: 0
              }}
            >
              AI Quantum Tutor
            </h4>
            <p
              style={{
                fontSize: '9px',
                color: '#00F2FE',
                fontFamily: 'var(--font-mono, monospace)',
                margin: '1px 0 0 0'
              }}
            >
              Gemini &bull; Live Grounded
            </p>
          </div>
        </div>

        {/* Quick Hint Button */}
        <button
          type="button"
          onClick={handleGetHint}
          disabled={hintLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 500,
            borderRadius: '6px',
            backgroundColor: 'rgba(120, 53, 15, 0.4)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            cursor: 'pointer'
          }}
          title="Get contextual hint"
        >
          <Lightbulb size={12} color="#fbbf24" />
          <span>{hintLoading ? 'Thinking...' : 'Hint'}</span>
        </button>
      </div>

      {/* Contextual Hint Banner (Hidden by default) */}
      {quickHint && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(120, 53, 15, 0.25)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#fde68a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingRight: '8px' }}>
            <Lightbulb size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, lineHeight: 1.4 }}>{quickHint}</p>
          </div>
          <button
            type="button"
            onClick={() => setQuickHint(null)}
            style={{ color: '#fbbf24', cursor: 'pointer', flexShrink: 0, padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Explanation Mode Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          backgroundColor: '#070b16',
          borderBottom: '1px solid #1e293b',
          fontSize: '10px',
          overflowX: 'auto'
        }}
      >
        <span style={{ color: '#64748b', marginRight: '4px' }}>Mode:</span>
        {[
          { id: 'explain', label: 'Intuitive' },
          { id: 'mathematical', label: 'Math' },
          { id: 'result', label: 'Result' },
          { id: 'debug', label: 'Debug' }
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setActionMode(m.id)}
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: actionMode === m.id ? 'bold' : 'normal',
              backgroundColor: actionMode === m.id ? 'rgba(168, 85, 247, 0.25)' : '#0f172a',
              color: actionMode === m.id ? '#c084fc' : '#94a3b8',
              border: actionMode === m.id ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div
        className="ql-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '12px'
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '92%',
                padding: '10px 12px',
                borderRadius: '10px',
                lineHeight: 1.5,
                backgroundColor:
                  msg.sender === 'user' ? 'rgba(6, 182, 212, 0.18)' : '#0d1428',
                color: msg.sender === 'user' ? '#a5f3fc' : '#e2e8f0',
                border:
                  msg.sender === 'user'
                    ? '1px solid rgba(6, 182, 212, 0.35)'
                    : '1px solid #1e293b',
                whiteSpace: 'pre-line',
                fontSize: '11px'
              }}
            >
              {msg.text}
            </div>
            {msg.source && (
              <span
                style={{
                  fontSize: '9px',
                  color: '#64748b',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)'
                }}
              >
                Source: {msg.source}
              </span>
            )}
          </div>
        ))}
        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#94a3b8',
              fontSize: '11px',
              fontStyle: 'italic',
              padding: '8px 12px',
              backgroundColor: '#0d1428',
              borderRadius: '10px',
              border: '1px solid #1e293b',
              width: 'fit-content'
            }}
          >
            <Bot size={13} color="#c084fc" />
            <span>Analyzing quantum state with Gemini...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Questions */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#070b16',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b'
          }}
        >
          Suggested Questions
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#0f172a',
                color: '#cbd5e1',
                border: '1px solid #1e293b',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div style={{ padding: '8px 12px', backgroundColor: '#080c18', borderTop: '1px solid #1e293b' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <input
            type="text"
            placeholder="Ask AI Tutor about this circuit..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              backgroundColor: '#0a0f1d',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#f8fafc',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #9333ea 0%, #06b6d4 100%)',
              color: '#ffffff',
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !query.trim() ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    </aside>
  );
};
