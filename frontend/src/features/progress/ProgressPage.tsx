/**
 * QUANTUMANIA - Comprehensive Learning Analytics & Topic Mastery Page
 * Phase 7: Production Readiness, Validation & Final SIH Demo
 * Provides an explainable, data-driven mastery breakdown, growth areas,
 * and historical learning event timeline across all 20 curriculum topics.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { adaptiveApi } from '../../services/api';
import { LearnerDashboardData } from '../../types/adaptive';
import { useAuth } from '../../context/AuthContext';

export const ProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<LearnerDashboardData | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adaptiveApi.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load progress analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
          color: 'var(--text-secondary)'
        }}
      >
        <RefreshCw size={32} className="animate-spin" color="var(--accent-cyan)" />
        <span style={{ fontSize: '1rem' }}>Loading learner intelligence & mastery metrics...</span>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div
        style={{
          padding: '3rem 1.5rem',
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center'
        }}
      >
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Unable to Load Progress</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {error || 'An unexpected error occurred while communicating with the analytics engine.'}
        </p>
        <button
          onClick={fetchAnalytics}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent-cyan)',
            color: '#04101e',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    overall_progress,
    completed_lessons_count,
    total_lessons_count,
    learning_streak_days,
    topic_mastery,
    strengths,
    weaknesses,
    recent_activity
  } = dashboardData;

  const filteredMastery = topic_mastery.filter((m) => {
    if (filterLevel === 'all') return true;
    return m.level.toLowerCase() === filterLevel.toLowerCase();
  });

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
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}
            >
              <BarChart3 size={20} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              Learning Analytics & Mastery
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '650px', fontSize: '0.95rem' }}>
            Deterministic, explainable topic mastery across all 20 quantum computing curriculum topics.
            Mastery is calculated from assessment accuracy, circuit simulation, and conceptual practice.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Top Level KPI Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        {/* Overall Curriculum Progress */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Curriculum Progress</span>
            <BookOpen size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {overall_progress.toFixed(1)}%
          </div>
          <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, overall_progress)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))'
              }}
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {completed_lessons_count} of {total_lessons_count} lessons completed
          </div>
        </div>

        {/* Total XP Points */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Experience</span>
            <Zap size={18} color="var(--accent-yellow)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-yellow)', marginBottom: '0.5rem' }}>
            {user?.points || 0} XP
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Earned from lesson completions & quizzes
          </div>
        </div>

        {/* Learning Streak */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Streak</span>
            <Sparkles size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
            {learning_streak_days} {learning_streak_days === 1 ? 'Day' : 'Days'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Consecutive daily quantum learning
          </div>
        </div>

        {/* Mastery Count */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Topics Mastered</span>
            <Award size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>
            {topic_mastery.filter((m) => m.score >= 70).length} / {topic_mastery.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Proficient (70%+) or Strong (85%+)
          </div>
        </div>
      </div>

      {/* Strengths & Growth Areas Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}
      >
        {/* Identified Strengths */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={18} color="#34d399" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Identified Strengths</h3>
          </div>
          {strengths.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              No strong topics recorded yet. Complete lessons and pass assessments to unlock strengths!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {strengths.map((sId) => {
                const topic = topic_mastery.find((t) => t.topic_id === sId);
                const title = topic?.topic_title || sId.replace(/_/g, ' ').toUpperCase();
                const score = topic?.score ?? 85;
                return (
                  <div
                    key={sId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
                    <span style={{ fontWeight: 700, color: '#34d399', fontSize: '0.9rem' }}>
                      {score.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Growth Areas (Weak Topics) */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={18} color="var(--accent-yellow)" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Growth Areas & Remediation</h3>
          </div>
          {weaknesses.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              No critical weak areas detected. Keep practicing in the Quantum Lab to maintain mastery!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {weaknesses.map((wId) => {
                const topic = topic_mastery.find((t) => t.topic_id === wId);
                const title = topic?.topic_title || wId.replace(/_/g, ' ').toUpperCase();
                const attempts = topic?.attempts ?? 1;
                return (
                  <div
                    key={wId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(234, 179, 8, 0.08)',
                      border: '1px solid rgba(234, 179, 8, 0.25)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {attempts} attempt(s) • Needs review
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/app/practice')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        backgroundColor: 'rgba(234, 179, 8, 0.2)',
                        color: 'var(--accent-yellow)',
                        border: '1px solid rgba(234, 179, 8, 0.4)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Practice
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Topic Mastery Detailed Breakdown */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          marginBottom: '2rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
              Curriculum Topic Mastery Matrix
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Deterministic scoring based on: Assessment (40%), Lesson (25%), Lab Simulation (15%), Practice (10%), Recency (10%).
            </p>
          </div>

          {/* Level Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 'strong', 'proficient', 'developing', 'beginning', 'not started'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  backgroundColor: filterLevel === lvl ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.05)',
                  color: filterLevel === lvl ? '#04101e' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {filteredMastery.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No topics match the selected level filter.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredMastery.map((tm) => {
              const isStrong = tm.level === 'Strong';
              const isProficient = tm.level === 'Proficient';

              let badgeBg = 'rgba(255, 255, 255, 0.05)';
              let badgeColor = 'var(--text-muted)';
              if (isStrong) {
                badgeBg = 'rgba(16, 185, 129, 0.15)';
                badgeColor = '#34d399';
              } else if (isProficient) {
                badgeBg = 'rgba(6, 182, 212, 0.15)';
                badgeColor = 'var(--accent-cyan)';
              } else if (tm.level === 'Developing') {
                badgeBg = 'rgba(234, 179, 8, 0.15)';
                badgeColor = 'var(--accent-yellow)';
              }

              return (
                <div
                  key={tm.topic_id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tm.topic_title}</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: badgeBg,
                          color: badgeColor
                        }}
                      >
                        {tm.level}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, tm.score)}%`,
                            height: '100%',
                            backgroundColor: isStrong ? '#34d399' : isProficient ? 'var(--accent-cyan)' : 'var(--accent-yellow)'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>
                        {tm.score.toFixed(0)}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Attempts: {tm.attempts}</span>
                      <span>Confidence: {(tm.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => navigate('/app/learn')}
                      style={{
                        flex: 1,
                        padding: '0.35rem 0.5rem',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Lesson
                    </button>
                    <button
                      onClick={() => navigate('/app/practice')}
                      style={{
                        flex: 1,
                        padding: '0.35rem 0.5rem',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Practice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Learning Activity Timeline */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Clock size={18} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            Recent Learning Activity Audit
          </h2>
        </div>

        {recent_activity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No recent activity recorded. Complete a lesson or simulate a circuit to begin your timeline.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recent_activity.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor:
                        act.event_type.includes('lesson')
                          ? '#34d399'
                          : act.event_type.includes('circuit')
                          ? 'var(--accent-cyan)'
                          : 'var(--accent-purple)'
                    }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {act.title || act.event_type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {act.description && (
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        • {act.description}
                      </span>
                    )}
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
