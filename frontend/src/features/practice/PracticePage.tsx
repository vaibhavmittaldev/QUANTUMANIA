/**
 * QUANTUMANIA - Interactive Quantum Practice Arena & Challenge Hub
 * Phase 7: Production Readiness, Validation & Final SIH Demo
 * Provides interactive hands-on circuit challenges and live conceptual skill checks
 * that directly feed into the learner's topic mastery and adaptive profile.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Zap,
  Cpu,
  Brain,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { adaptiveApi } from '../../services/api';

interface CircuitChallenge {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  description: string;
  objective: string;
  templateId?: string;
  lessonId?: string;
}

interface ConceptQuiz {
  id: string;
  topicId: string;
  topicTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
}

const CIRCUIT_CHALLENGES: CircuitChallenge[] = [
  {
    id: 'ch_superposition',
    title: 'Single-Qubit Superposition Generator',
    topicId: 'superposition',
    topicTitle: 'The Superposition Principle',
    difficulty: 'Beginner',
    xpReward: 50,
    description: 'Transform a classical ground state |0⟩ into a balanced superposition state (|0⟩ + |1⟩)/√2 using the Hadamard transformation.',
    objective: 'Apply an H gate to qubit 0 and simulate 1024 shots to observe equal 50% outcome distribution.',
    templateId: 'superposition',
    lessonId: 'les_03_superposition'
  },
  {
    id: 'ch_bell_state',
    title: 'Bell State |Φ+⟩ Entanglement',
    topicId: 'cnot_gate',
    topicTitle: 'Entanglement & CNOT Operation',
    difficulty: 'Intermediate',
    xpReward: 75,
    description: 'Construct the maximally entangled Einstein-Podolsky-Rosen (EPR) Bell pair using a Hadamard gate and a Controlled-NOT.',
    objective: 'Apply H on qubit 0, followed by CNOT with control=0 and target=1. Measure both qubits.',
    templateId: 'bell-state',
    lessonId: 'les_09_cnot_gate'
  },
  {
    id: 'ch_ghz_state',
    title: '3-Qubit GHZ Quantum Correlation',
    topicId: 'multi_qubit_systems',
    topicTitle: 'Multi-Qubit Systems & Entanglement',
    difficulty: 'Advanced',
    xpReward: 100,
    description: 'Prepare the tri-partite Greenberger-Horne-Zeilinger entangled state (|000⟩ + |111⟩)/√2 across 3 qubits.',
    objective: 'Cascade two CNOT gates following a superposition initialization on qubit 0.',
    templateId: 'ghz-state',
    lessonId: 'les_11_bell_states'
  }
];

const CONCEPT_QUIZZES: ConceptQuiz[] = [
  {
    id: 'qz_01',
    topicId: 'superposition',
    topicTitle: 'The Superposition Principle',
    question: 'When a qubit is in the state |+⟩ = (|0⟩ + |1⟩)/√2, what is the probability of measuring outcome 1?',
    options: ['0% (it is deterministically 0)', '50% (|1/√2|² = 0.5)', '100% (it is inverted)', 'Undefined until observed'],
    correctIndex: 1,
    explanation: 'By the Born rule, the probability of measuring an outcome is the square of the magnitude of its amplitude: |1/√2|² = 1/2 = 50%.',
    xpReward: 30
  },
  {
    id: 'qz_02',
    topicId: 'cnot_gate',
    topicTitle: 'Controlled-NOT Operation',
    question: 'If the control qubit is in state |1⟩ and the target qubit is in state |1⟩, what will the target qubit state be after applying a CNOT gate?',
    options: ['|1⟩', '|0⟩', '(|0⟩ + |1⟩)/√2', '|−⟩'],
    correctIndex: 1,
    explanation: 'CNOT flips the target qubit (applies Pauli-X) if and only if the control qubit is |1⟩. Since target was |1⟩, flipping it yields |0⟩.',
    xpReward: 35
  },
  {
    id: 'qz_03',
    topicId: 'quantum_foundations',
    topicTitle: 'Quantum Foundations & Reversibility',
    question: 'Why are all quantum gate operations (excluding measurement) mathematically represented by unitary matrices?',
    options: [
      'To ensure quantum circuits are physically reversible and preserve the total probability norm of 1',
      'Because classical computers cannot multiply non-unitary matrices',
      'Because quantum processors only operate at absolute zero temperature',
      'To prevent quantum noise from ever affecting the qubits'
    ],
    correctIndex: 0,
    explanation: 'Unitary transformations U satisfy U†U = I, which guarantees that state vector lengths remain normalized to 1 and operations can be undone (reversibility).',
    xpReward: 30
  }
];

export const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'challenges' | 'quizzes'>('challenges');

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuizIds, setSubmittedQuizIds] = useState<Record<string, boolean>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<string, { isCorrect: boolean; explanation: string }>>({});
  const [earnedXpTotal, setEarnedXpTotal] = useState(0);

  const handleSelectOption = (quizId: string, optionIndex: number) => {
    if (submittedQuizIds[quizId]) return;
    setSelectedAnswers(prev => ({ ...prev, [quizId]: optionIndex }));
  };

  const handleSubmitQuiz = async (quiz: ConceptQuiz) => {
    const selectedIdx = selectedAnswers[quiz.id];
    if (selectedIdx === undefined) return;

    const isCorrect = selectedIdx === quiz.correctIndex;
    setSubmittedQuizIds(prev => ({ ...prev, [quiz.id]: true }));
    setQuizFeedback(prev => ({
      ...prev,
      [quiz.id]: { isCorrect, explanation: quiz.explanation }
    }));

    if (isCorrect) {
      setEarnedXpTotal(prev => prev + quiz.xpReward);
    }

    // Persist learning event to adaptive backend
    try {
      await adaptiveApi.trackEvent({
        event_type: 'question_answered',
        topic_id: quiz.topicId,
        metadata: {
          quiz_id: quiz.id,
          is_correct: isCorrect,
          selected_index: selectedIdx,
          xp_awarded: isCorrect ? quiz.xpReward : 0
        }
      });
      // Submit assessment result to trigger immediate topic mastery update
      await adaptiveApi.submitAssessment({
        topic_id: quiz.topicId,
        question_id: quiz.id,
        is_correct: isCorrect,
        score: isCorrect ? 100 : 35
      });
    } catch {
      // Background tracking non-blocking
    }
  };

  const handleLaunchChallenge = (ch: CircuitChallenge) => {
    const params = new URLSearchParams();
    if (ch.templateId) params.set('template', ch.templateId);
    if (ch.lessonId) params.set('lesson_id', ch.lessonId);
    params.set('topic', ch.topicTitle);
    navigate(`/app/quantum-lab?${params.toString()}`);
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399'
              }}
            >
              <Trophy size={20} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              Quantum Practice Arena
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '650px', fontSize: '0.95rem' }}>
            Hone your quantum intuition with hands-on lab challenges and conceptual knowledge checks.
            Every completed exercise updates your live Topic Mastery and unlocks adaptive recommendations.
          </p>
        </div>

        {earnedXpTotal > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#34d399',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <Sparkles size={18} />
            <span>+{earnedXpTotal} XP Earned in Session</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '2rem'
        }}
      >
        <button
          onClick={() => setActiveTab('challenges')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'challenges' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
            color: activeTab === 'challenges' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'challenges' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Cpu size={18} />
          <span>Interactive Circuit Challenges ({CIRCUIT_CHALLENGES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'quizzes' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
            color: activeTab === 'quizzes' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'quizzes' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Brain size={18} />
          <span>Concept Knowledge Checks ({CONCEPT_QUIZZES.length})</span>
        </button>
      </div>

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {CIRCUIT_CHALLENGES.map((ch) => (
            <div
              key={ch.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color var(--transition-fast)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor:
                        ch.difficulty === 'Beginner'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : ch.difficulty === 'Intermediate'
                          ? 'rgba(6, 182, 212, 0.15)'
                          : 'rgba(236, 72, 153, 0.15)',
                      color:
                        ch.difficulty === 'Beginner'
                          ? '#34d399'
                          : ch.difficulty === 'Intermediate'
                          ? 'var(--accent-cyan)'
                          : '#f472b6'
                    }}
                  >
                    {ch.difficulty}
                  </span>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--accent-yellow)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Zap size={14} /> +{ch.xpReward} XP
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                  {ch.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {ch.description}
                </p>

                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <strong style={{ color: 'var(--accent-cyan)' }}>Objective: </strong>
                  <span style={{ color: 'var(--text-primary)' }}>{ch.objective}</span>
                </div>
              </div>

              <button
                onClick={() => handleLaunchChallenge(ch)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'var(--accent-cyan)',
                  color: '#04101e',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'opacity var(--transition-fast)'
                }}
              >
                <span>Launch in Quantum Lab</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === 'quizzes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {CONCEPT_QUIZZES.map((quiz) => {
            const isSubmitted = !!submittedQuizIds[quiz.id];
            const feedback = quizFeedback[quiz.id];
            const currentSelection = selectedAnswers[quiz.id];

            return (
              <div
                key={quiz.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HelpCircle size={18} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Topic: {quiz.topicTitle}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-yellow)' }}>
                    +{quiz.xpReward} XP
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', lineHeight: 1.4 }}>
                  {quiz.question}
                </h3>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {quiz.options.map((option, idx) => {
                    const isSelected = currentSelection === idx;
                    let optionBg = 'rgba(255, 255, 255, 0.03)';
                    let optionBorder = 'rgba(255, 255, 255, 0.08)';

                    if (isSubmitted) {
                      if (idx === quiz.correctIndex) {
                        optionBg = 'rgba(16, 185, 129, 0.15)';
                        optionBorder = 'rgba(16, 185, 129, 0.4)';
                      } else if (isSelected) {
                        optionBg = 'rgba(239, 68, 68, 0.15)';
                        optionBorder = 'rgba(239, 68, 68, 0.4)';
                      }
                    } else if (isSelected) {
                      optionBg = 'rgba(6, 182, 212, 0.15)';
                      optionBorder = 'var(--accent-cyan)';
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectOption(quiz.id, idx)}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: optionBg,
                          border: `1px solid ${optionBorder}`,
                          cursor: isSubmitted ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.9rem',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'}`,
                            backgroundColor: isSelected ? 'var(--accent-cyan)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#04101e',
                            flexShrink: 0
                          }}
                        >
                          {isSelected && '✓'}
                        </div>
                        <span style={{ color: 'var(--text-primary)' }}>{option}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Feedback Box */}
                {feedback && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: feedback.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${feedback.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}
                  >
                    {feedback.isCorrect ? (
                      <CheckCircle2 size={20} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <XCircle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: feedback.isCorrect ? '#34d399' : '#f87171', marginBottom: '0.25rem' }}>
                        {feedback.isCorrect ? 'Correct! Mastery updated.' : 'Not quite. Here is the concept:'}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {feedback.explanation}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action button */}
                {!isSubmitted ? (
                  <button
                    disabled={currentSelection === undefined}
                    onClick={() => handleSubmitQuiz(quiz)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: currentSelection !== undefined ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                      color: currentSelection !== undefined ? '#04101e' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: currentSelection !== undefined ? 'pointer' : 'not-allowed',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    Verify Answer
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>Completed • Recorded in Learner Model</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
