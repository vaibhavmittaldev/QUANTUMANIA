import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/common/FeedbackStates';
import { Cpu, BookOpen, Flame, Award, ArrowRight, Sparkles } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const displayName = user?.display_name || user?.username || 'Learner';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(14, 21, 38, 0.8) 100%)',
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
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-cyan-subtle) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-cyan">Phase 1 Foundation Ready</span>
            <span className="badge badge-purple">{user?.experience_level || 'beginner'} Level</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Welcome back, <span style={{ color: 'var(--accent-cyan)' }}>{displayName}</span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '0.95rem' }}>
            Your quantum learning cockpit is set up. You can explore the Quantum Lab workbench destination or review your account profile.
          </p>
        </div>
      </div>

      {/* User Stats Overview (Real values from backend profile, no fake statistics) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Award size={18} color="var(--accent-cyan)" />
            <span>Total XP Points</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {user?.points ?? 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>XP</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Flame size={18} color="var(--accent-amber)" />
            <span>Active Streak</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {user?.current_streak_days ?? 1} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>day(s)</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <BookOpen size={18} color="var(--accent-purple)" />
            <span>Lessons Completed</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            0 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 16 (Phase 2)</span>
          </div>
        </div>
      </div>

      {/* Main Action Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Continue Learning Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-cyan-subtle)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>Curriculum & Lessons</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upcoming Phase 2</span>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
            Explore introductory quantum concepts including single-qubit superpositions, Hadamard gates, and Dirac notation.
          </p>

          <Link to="/app/learn" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
            <span>Preview Course Outline</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Quantum Lab Quick Action Card */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(27, 20, 48, 0.4) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-purple-subtle)',
                color: 'var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>Quantum Circuit Lab</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>Tanishq Track (Phase 3–5)</span>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
            Visual drag-and-drop circuit canvas, statevector mathematical simulator, and grounded Socratic AI Tutor integration point.
          </p>

          <Link to="/app/quantum-lab" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            <span>Open Quantum Lab</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Progress & Recent Activity Section (Honest Empty States) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}
      >
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Your Learning Progress</h2>
          <EmptyState
            title="No progress recorded yet"
            description="Your learning progress and mastery achievements will appear here once you begin your first lesson."
          />
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>Recent Activity</h2>
            <Sparkles size={16} color="var(--accent-cyan)" />
          </div>
          <EmptyState
            title="No recent activity"
            description="Your simulation experiments, completed quizzes, and challenge submissions will be logged here."
          />
        </div>
      </div>
    </div>
  );
};
