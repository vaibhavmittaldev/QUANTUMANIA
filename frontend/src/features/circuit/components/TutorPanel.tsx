/**
 * QUANTUMANIA - AI Quantum Learning Tutor Panel
 * Phase 5: AI Quantum Tutor
 * Context-aware educational chat panel with quick actions, progressive hints, and socratic dialogue.
 */

import React, { useState, useEffect, useRef } from 'react';
import { CanonicalCircuit, SimulationResult } from '../../../types/circuit';
import {
  TutorMessage,
  TutorMode,
  TutorRequest,
  LessonContext,
  CircuitContext,
  SimulationContext
} from '../../../types/tutor';
import { tutorApi } from '../../../services/api';
import {
  Sparkles,
  Send,
  RotateCcw,
  Lightbulb,
  HelpCircle,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Cpu,
  ArrowRight
} from 'lucide-react';

interface TutorPanelProps {
  circuit: CanonicalCircuit;
  simulationResult: SimulationResult | null;
  isStale: boolean;
  lessonContext?: LessonContext | null;
  isOpen: boolean;
  onToggle: () => void;
}

export const TutorPanel: React.FC<TutorPanelProps> = ({
  circuit,
  simulationResult,
  isStale,
  lessonContext,
  isOpen,
  onToggle
}) => {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [activeProviderName, setActiveProviderName] = useState<string>('AI Tutor');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Fetch tutor service status once on mount
  useEffect(() => {
    tutorApi
      .getStatus()
      .then((res) => {
        if (res.active_provider) {
          const formatted =
            res.active_provider === 'deterministic'
              ? 'Pedagogical Engine'
              : res.active_provider.toUpperCase();
          setActiveProviderName(formatted);
        }
      })
      .catch(() => {
        setActiveProviderName('Pedagogical Engine');
      });
  }, []);

  // Build the current context payload
  const buildCurrentContext = (): {
    circuit_context: CircuitContext;
    simulation_context: SimulationContext;
    lesson_context?: LessonContext;
  } => {
    const sortedGates = [...circuit.gates].sort((a, b) => a.step - b.step);
    const gatesSummary = sortedGates.map((g) => {
      const tgt = g.target !== undefined ? `q${g.target}` : `q${g.targets?.join(',')}`;
      const ctrl = g.control !== undefined ? ` (ctrl=q${g.control})` : '';
      return `${g.type} on ${tgt}${ctrl} at step ${g.step}`;
    });

    const circuitCtx: CircuitContext = {
      qubits: circuit.qubits,
      depth: Math.max(0, ...circuit.gates.map((g) => g.step + 1), 0),
      gate_count: circuit.gates.length,
      gates_summary: gatesSummary,
      circuit
    };

    const simCtx: SimulationContext = {
      has_simulation: simulationResult !== null && simulationResult.success,
      is_stale: isStale,
      shots: simulationResult?.shots,
      probabilities: simulationResult?.probabilities,
      counts: simulationResult?.counts,
      bloch_vectors: simulationResult?.bloch_vectors
    };

    return {
      circuit_context: circuitCtx,
      simulation_context: simCtx,
      ...(lessonContext ? { lesson_context: lessonContext } : {})
    };
  };

  // Dispatch a query to the AI Tutor
  const sendTutorQuery = async (mode: TutorMode, userPrompt?: string, customHintLevel?: number) => {
    if (isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);

    const promptText = userPrompt?.trim() || '';

    // If user provided a custom prompt, record user message in state
    if (promptText) {
      const userMsg: TutorMessage = {
        id: 'msg_user_' + Date.now(),
        role: 'user',
        content: promptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
    }

    const { circuit_context, simulation_context, lesson_context } = buildCurrentContext();

    // Prepare recent conversation for context (limit to last 6 messages)
    const recentConv = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content
    }));

    const payload: TutorRequest = {
      mode,
      message: promptText || undefined,
      hint_level: customHintLevel ?? hintLevel,
      circuit_context,
      simulation_context,
      lesson_context,
      conversation: recentConv
    };

    try {
      const response = await tutorApi.query(payload);

      const assistantMsg: TutorMessage = {
        id: 'msg_asst_' + Date.now(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: response.mode,
        keyPoints: response.key_points,
        nextStep: response.next_step,
        followUpQuestion: response.follow_up_question,
        contextUsed: response.context_used
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Cycle progressive hint level 1 -> 2 -> 3 -> 1
      if (mode === 'hint') {
        setHintLevel((prev) => (prev >= 3 ? 1 : prev + 1));
      }
    } catch {
      setErrorMessage(
        'The tutor encountered an issue. You can continue building circuits and running simulations.'
      );
    } finally {

      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setErrorMessage(null);
    setHintLevel(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    sendTutorQuery('ask', inputText);
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(180deg, rgba(20, 24, 42, 0.98) 0%, rgba(15, 18, 35, 0.98) 100%)',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.15rem',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Sparkles size={17} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                AI Quantum Tutor
              </h3>
              <span
                className="badge badge-purple"
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
              >
                {activeProviderName}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Context-aware quantum guide &amp; algorithmic reasoning
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearConversation}
              className="btn btn-secondary"
              title="Clear conversation history (preserves circuit)"
              aria-label="Clear tutor conversation"
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem' }}
            >
              <RotateCcw size={13} style={{ marginRight: '0.25rem' }} /> Clear Chat
            </button>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="btn btn-secondary"
            title={isOpen ? 'Collapse Tutor' : 'Expand Tutor'}
            aria-label={isOpen ? 'Collapse Tutor Panel' : 'Expand Tutor Panel'}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.55rem' }}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          {/* Context Transparency Indicator (Section 31) */}
          <div
            style={{
              padding: '0.5rem 1.15rem',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tutor Context:</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                <Cpu size={11} style={{ marginRight: '0.25rem' }} />
                {circuit.qubits} Qubit{circuit.qubits > 1 ? 's' : ''} ({circuit.gates.length} Gate
                {circuit.gates.length !== 1 ? 's' : ''})
              </span>

              {simulationResult ? (
                isStale ? (
                  <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                    <AlertTriangle size={11} style={{ marginRight: '0.25rem' }} />
                    Simulation Stale (Circuit Changed)
                  </span>
                ) : (
                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                    <CheckCircle2 size={11} style={{ marginRight: '0.25rem' }} />
                    Simulation Verified ({simulationResult.shots} shots)
                  </span>
                )
              ) : (
                <span className="badge" style={{ fontSize: '0.68rem', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  Simulation Pending
                </span>
              )}

              {lessonContext?.title && (
                <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                  Lesson: {lessonContext.title}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons (Section 30) */}
          <div
            style={{
              padding: '0.6rem 1.15rem',
              backgroundColor: 'rgba(255, 255, 255, 0.01)',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            <button
              type="button"
              onClick={() => sendTutorQuery('explain')}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', whiteSpace: 'nowrap' }}
            >
              <Lightbulb size={13} style={{ marginRight: '0.3rem', color: 'var(--accent-amber)' }} />
              Explain Circuit
            </button>

            <button
              type="button"
              onClick={() => sendTutorQuery('hint', undefined, hintLevel)}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', whiteSpace: 'nowrap' }}
            >
              <HelpCircle size={13} style={{ marginRight: '0.3rem', color: 'var(--accent-cyan)' }} />
              Give Me a Hint (Lvl {hintLevel})
            </button>

            <button
              type="button"
              onClick={() => sendTutorQuery('analyze')}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', whiteSpace: 'nowrap' }}
            >
              <CheckCircle2 size={13} style={{ marginRight: '0.3rem', color: 'var(--accent-emerald)' }} />
              Analyze My Circuit
            </button>

            <button
              type="button"
              onClick={() => sendTutorQuery('guide')}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', whiteSpace: 'nowrap' }}
            >
              <Compass size={13} style={{ marginRight: '0.3rem', color: 'var(--accent-purple)' }} />
              What Should I Try?
            </button>

            {simulationResult && (
              <button
                type="button"
                onClick={() =>
                  sendTutorQuery(
                    'ask',
                    'Explain why my simulation produced these specific probabilities and measurement counts.'
                  )
                }
                disabled={isLoading}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', whiteSpace: 'nowrap' }}
              >
                📊 Explain Results
              </button>
            )}
          </div>

          {/* Conversation Chat Body */}
          <div
            role="log"
            aria-live="polite"
            style={{
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '380px',
              minHeight: '220px',
              overflowY: 'auto'
            }}
          >
            {/* Empty State Suggestion (Section 34) */}
            {messages.length === 0 && !isLoading && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '0.75rem',
                  padding: '1.5rem 1rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-purple)'
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                    Ask me about your quantum circuit
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, maxWidth: '420px' }}>
                    I understand your gates, qubit registers, statevector amplitudes, and simulation outcomes. Try asking:
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginTop: '0.4rem' }}>
                  {[
                    'Explain this circuit',
                    'Why does H create superposition?',
                    'What does the CNOT gate do?',
                    'Why did I get this result?'
                  ].map((samplePrompt) => (
                    <button
                      key={samplePrompt}
                      type="button"
                      onClick={() => sendTutorQuery('ask', samplePrompt)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderRadius: '12px' }}
                    >
                      {samplePrompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: '0.3rem'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '0.85rem 1.1rem',
                      borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      backgroundColor: isUser ? 'rgba(79, 70, 229, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                      border: isUser ? '1px solid rgba(79, 70, 229, 0.5)' : '1px solid var(--border-medium)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {msg.content}

                    {/* Key Takeaways Callout */}
                    {msg.keyPoints && msg.keyPoints.length > 0 && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.6rem 0.8rem',
                          backgroundColor: 'rgba(99, 102, 241, 0.08)',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '3px solid var(--accent-purple)'
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', display: 'block', marginBottom: '0.2rem' }}>
                          Key Takeaways:
                        </span>
                        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {msg.keyPoints.map((kp, idx) => (
                            <li key={idx}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Action Suggestion */}
                    {msg.nextStep && (
                      <div
                        style={{
                          marginTop: '0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.78rem',
                          color: 'var(--accent-cyan)'
                        }}
                      >
                        <ArrowRight size={13} />
                        <span>
                          <strong>Next Step:</strong> {msg.nextStep}
                        </span>
                      </div>
                    )}

                    {/* Socratic Follow-Up Question Prompt */}
                    {msg.followUpQuestion && (
                      <button
                        type="button"
                        onClick={() => sendTutorQuery('ask', msg.followUpQuestion)}
                        style={{
                          marginTop: '0.6rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: 'var(--accent-cyan)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <HelpCircle size={12} />
                        <span>{msg.followUpQuestion}</span>
                      </button>
                    )}
                  </div>

                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0 0.2rem' }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Thinking / Loading State Indicator (Section 32) */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                  Tutor is reasoning through circuit state and simulation data...
                </span>
              </div>
            )}

            {/* Error Message Notice */}
            {errorMessage && (
              <div
                style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.8rem'
                }}
              >
                {errorMessage}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* User Input Bar */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '0.75rem 1.15rem',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.15)'
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question about your circuit, gates, or simulation results..."
              aria-label="Ask quantum tutor question"
              disabled={isLoading}
              maxLength={2000}
              style={{
                flex: 1,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                padding: '0.55rem 0.85rem',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="btn btn-primary"
              aria-label="Send question to AI tutor"
              style={{
                padding: '0.55rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.85rem',
                opacity: !inputText.trim() || isLoading ? 0.5 : 1,
                cursor: !inputText.trim() || isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={15} />
              <span>Ask</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
};
