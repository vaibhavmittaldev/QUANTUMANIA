import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, LoadingSpinner } from '../../components/common/FeedbackStates';
import { adaptiveApi, learningApi } from '../../services/api';
import { LearnerDashboardData } from '../../types/adaptive';
import { LearningProgressSummary } from '../../types/learning';
import {
  Cpu,
  BookOpen,
  Flame,
  Award,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  Compass,
  Lightbulb,
  RefreshCw,
  HelpCircle,
  Target
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<LearnerDashboardData | null>(null);
  const [progress, setProgress] = useState<LearningProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<'all' | 'active' | 'weak'>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const [dashRes, progRes] = await Promise.all([
          adaptiveApi.getDashboard().catch(() => null),
          learningApi.getProgress().catch(() => null)
        ]);

        if (isMounted) {
          if (dashRes) setDashboardData(dashRes);
          if (progRes) setProgress(progRes);
        }
      } catch (err) {
        console.error('Failed to load adaptive dashboard:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = dashboardData?.display_name || user?.display_name || user?.username || 'Learner';
  const overallProgress = dashboardData?.overall_progress ?? progress?.course_progress_percent ?? 0;
  const completedLessons = dashboardData?.completed_lessons_count ?? progress?.completed_lessons_count ?? 0;
  const totalLessons = dashboardData?.total_lessons_count ?? progress?.total_lessons_count ?? 20;
  const totalXp = dashboardData?.total_xp ?? user?.points ?? progress?.total_xp ?? 0;
  const streakDays = dashboardData?.learning_streak_days ?? user?.current_streak_days ?? 0;
  const activeDifficulty = dashboardData?.active_difficulty ?? 'beginner';
  const weaknesses = dashboardData?.weaknesses ?? [];
  const recommendations = dashboardData?.recommendations ?? [];
  const masteries = dashboardData?.topic_mastery ?? [];
  const recentActivities = dashboardData?.recent_activity ?? [];

  // Helper for level badge colors
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Strong':
        return { label: 'Strong (85-100%)', color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'Proficient':
        return { label: 'Proficient (70-84%)', color: 'var(--accent-purple)', bg: 'rgba(139, 92, 246, 0.15)' };
      case 'Developing':
        return { label: 'Developing (50-69%)', color: 'var(--accent-cyan)', bg: 'rgba(0, 242, 254, 0.15)' };
      case 'Beginning':
        return { label: 'Beginning (25-49%)', color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { label: 'Not Started (0%)', color: 'var(--text-muted)', bg: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  const filteredMasteries = masteries.filter((m) => {
    if (selectedTopicFilter === 'active') return m.score > 0;
    if (selectedTopicFilter === 'weak') return weaknesses.includes(m.topic_id);
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner with Real Adaptive Model Context */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(14, 21, 38, 0.85) 100%)',
          border: '1px solid var(--border-medium)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: '-40px',
            top: '-40px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-cyan-subtle) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
            <span className="badge badge-cyan">Adaptive Learning Engine</span>
            <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
              {activeDifficulty} Difficulty
            </span>
            {streakDays > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: 'var(--accent-amber)',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                <Flame size={14} />
                <span>{streakDays} Day Active Streak</span>
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Welcome back, <span style={{ color: 'var(--accent-cyan)' }}>{displayName}</span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Your learning pathway automatically adapts to your circuit builds, simulation results, quiz performance, and AI tutor interactions.
          </p>
        </div>
      </div>

      {/* Key Learner Metrics Grid (Authoritative, Verified Values) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Award size={18} color="var(--accent-cyan)" />
            <span>Total Experience Points</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {totalXp} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>XP</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Flame size={18} color="var(--accent-amber)" />
            <span>Learning Streak</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {streakDays} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>consecutive day(s)</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <BookOpen size={18} color="var(--accent-purple)" />
            <span>Curriculum Lessons</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {completedLessons} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {totalLessons}</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Target size={18} color="var(--accent-emerald)" />
            <span>Overall Syllabus Progress</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {overallProgress}%
          </div>
        </div>
      </div>

      {/* Weak Areas Remediation Alert (Section 17 & 26) */}
      {weaknesses.length > 0 && (
        <div
          className="card"
          style={{
            border: '1px solid rgba(245, 158, 11, 0.4)',
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={22} color="var(--accent-amber)" />
            <div>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--accent-amber)' }}>
                Targeted Remediation Focus
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Based on recent assessment accuracy and tutor inquiries, our learner model recommends reinforcing:
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            {weaknesses.map((wId) => {
              const matchingTopic = masteries.find((m) => m.topic_id === wId);
              const title = matchingTopic?.topic_title || wId.replace('_', ' ').toUpperCase();
              return (
                <span
                  key={wId}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}
                >
                  {title} ({matchingTopic ? `${matchingTopic.score}% Mastery` : 'Practice Needed'})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Personalized Recommendations Section (Section 20–25, 45–47) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Personalized Recommendations</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Actionable next steps generated from your topic mastery, prerequisites, and recent activity.
            </p>
          </div>
          <Sparkles size={20} color="var(--accent-cyan)" />
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem 0' }}>
            <LoadingSpinner message="Synthesizing personalized recommendations..." />
          </div>
        ) : recommendations.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem'
            }}
          >
            {recommendations.map((rec) => {
              const isContinue = rec.type === 'continue_learning';
              const isLab = rec.type === 'build_circuit' || rec.type === 'run_simulation';
              const isReview = rec.type === 'review_lesson';
              const isTutor = rec.type === 'ask_tutor';

              let badgeColor = 'badge-cyan';
              let Icon = Compass;
              if (isContinue) {
                badgeColor = 'badge-cyan';
                Icon = PlayCircle;
              } else if (isLab) {
                badgeColor = 'badge-purple';
                Icon = Cpu;
              } else if (isReview) {
                badgeColor = 'badge-amber';
                Icon = RefreshCw;
              } else if (isTutor) {
                badgeColor = 'badge-purple';
                Icon = HelpCircle;
              }

              return (
                <div
                  key={rec.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isReview ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-medium)',
                    background: isLab
                      ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(27, 20, 48, 0.35) 100%)'
                      : undefined
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <span className={`badge ${badgeColor}`} style={{ textTransform: 'capitalize' }}>
                        {rec.type.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Priority #{rec.priority}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      {rec.title}
                    </h3>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                      {rec.description}
                    </p>

                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderLeft: '3px solid var(--accent-cyan)',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        marginBottom: '1.25rem'
                      }}
                    >
                      <strong style={{ color: 'var(--text-secondary)' }}>Why this?</strong> {rec.reason}
                    </div>
                  </div>

                  <Link
                    to={rec.action_url}
                    className={`btn ${isContinue || isReview ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Icon size={16} />
                    <span>Take Action</span>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="All recommendations caught up"
            description="Start exploring new quantum lessons to receive fresh personalized insights."
          />
        )}
      </div>

      {/* Main Analytics: Topic Mastery Breakdown (Section 12–16) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem' }}>Verifiable Topic Mastery</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Scores derived from assessment accuracy (40%), lesson completion (25%), circuit simulation (15%), tutor interaction (10%), and recency (10%).
            </p>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-base)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setSelectedTopicFilter('all')}
              className={`btn btn-ghost ${selectedTopicFilter === 'all' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              All Topics ({masteries.length})
            </button>
            <button
              onClick={() => setSelectedTopicFilter('active')}
              className={`btn btn-ghost ${selectedTopicFilter === 'active' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              Active ({masteries.filter((m) => m.score > 0).length})
            </button>
            {weaknesses.length > 0 && (
              <button
                onClick={() => setSelectedTopicFilter('weak')}
                className={`btn btn-ghost ${selectedTopicFilter === 'weak' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', color: 'var(--accent-amber)' }}
              >
                Needs Focus ({weaknesses.length})
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading topic masteries..." />
        ) : filteredMasteries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredMasteries.map((m) => {
              const badge = getLevelBadge(m.level);
              return (
                <div
                  key={m.topic_id}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {m.topic_title}
                      </span>
                      {m.module_title && (
                        <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          · {m.module_title}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: badge.color,
                          backgroundColor: badge.bg
                        }}
                      >
                        {badge.label}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', minWidth: '40px', textAlign: 'right' }}>
                        {m.score}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div
                    role="progressbar"
                    aria-valuenow={m.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${m.topic_title} mastery progress`}
                    style={{
                      height: '6px',
                      backgroundColor: 'var(--bg-base)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                      marginBottom: '0.4rem'
                    }}
                  >
                    <div
                      style={{
                        width: `${m.score}%`,
                        height: '100%',
                        backgroundColor: badge.color,
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  {/* Evidence signals */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>
                      Evidence: {m.attempts > 0 ? `${m.correct_attempts}/${m.attempts} assessment questions correct` : 'Coursework progress'}
                    </span>
                    <span>
                      Confidence: {m.confidence >= 0.8 ? 'High' : m.confidence >= 0.4 ? 'Medium' : m.score > 0 ? 'Low' : 'None'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No topics match your filter"
            description="Try changing the filter to view all topics."
          />
        )}
      </div>

      {/* Lower Section: Modules Breakdown & Recent Activity Timeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Module Progress Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>Course Syllabus Modules</h2>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>
              {overallProgress}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Course completion percentage"
            style={{
              height: '8px',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '999px',
              overflow: 'hidden',
              marginBottom: '1.5rem'
            }}
          >
            <div
              style={{
                width: `${overallProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          {progress?.modules_progress && progress.modules_progress.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {progress.modules_progress.map((mod, idx) => (
                <div
                  key={mod.module_id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      M{idx + 1}: {mod.title}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {mod.completed_lessons} / {mod.total_lessons} ({mod.progress_percent}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '4px',
                      backgroundColor: 'var(--bg-base)',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${mod.progress_percent}%`,
                        height: '100%',
                        backgroundColor: mod.progress_percent === 100 ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No modules started"
              description="Start your first lesson to track progress."
            />
          )}
        </div>

        {/* Real Activity Timeline (Section 29) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>Recent Learning Activity</h2>
            <Sparkles size={16} color="var(--accent-cyan)" />
          </div>

          {isLoading ? (
            <LoadingSpinner message="Loading activity timeline..." />
          ) : recentActivities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentActivities.map((act) => {
                const isComplete = act.event_type === 'lesson_completed';
                const isSim = act.event_type === 'circuit_simulated';
                const isTutor = act.event_type.startsWith('tutor');

                let Icon = BookOpen;
                let iconColor = 'var(--accent-cyan)';
                if (isComplete) {
                  Icon = CheckCircle2;
                  iconColor = 'var(--accent-emerald)';
                } else if (isSim) {
                  Icon = Cpu;
                  iconColor = 'var(--accent-purple)';
                } else if (isTutor) {
                  Icon = Lightbulb;
                  iconColor = 'var(--accent-amber)';
                }

                return (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <Icon size={18} color={iconColor} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {act.description}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {new Date(act.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No recent learning activity"
              description="Complete a lesson, simulate a circuit, or consult the AI Tutor to log activity."
            />
          )}
        </div>
      </div>
    </div>
  );
};
