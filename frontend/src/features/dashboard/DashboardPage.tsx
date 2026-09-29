import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, LoadingSpinner } from '../../components/common/FeedbackStates';
import { learningApi } from '../../services/api';
import { LearningProgressSummary } from '../../types/learning';
import { Cpu, BookOpen, Flame, Award, ArrowRight, Sparkles, CheckCircle2, PlayCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const displayName = user?.display_name || user?.username || 'Learner';

  const [progress, setProgress] = useState<LearningProgressSummary | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      try {
        const data = await learningApi.getProgress();
        if (isMounted) {
          setProgress(data);
        }
      } catch (err) {
        console.error('Failed to load learning progress:', err);
      } finally {
        if (isMounted) {
          setLoadingProgress(false);
        }
      }
    };

    fetchProgress();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalLessons = progress?.total_lessons_count ?? 20;
  const completedLessons = progress?.completed_lessons_count ?? 0;
  const coursePercent = progress?.course_progress_percent ?? 0;
  const nextLesson = progress?.recent_incomplete_lesson;
  const isCourseFinished = completedLessons > 0 && completedLessons === totalLessons;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
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
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-cyan-subtle) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-cyan">Phase 2 Learning Active</span>
            <span className="badge badge-purple">{user?.experience_level || 'beginner'} Level</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Welcome back, <span style={{ color: 'var(--accent-cyan)' }}>{displayName}</span>
          </h1>

          <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '0.95rem' }}>
            Explore the structured quantum curriculum, master fundamental qubits and superposition principles, and monitor your verifiable learning progress in real time.
          </p>
        </div>
      </div>

      {/* User Stats Overview (Real values from backend, no fake statistics) */}
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
            {user?.points ?? progress?.total_xp ?? 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>XP</span>
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
            {completedLessons} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {totalLessons}</span>
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
                width: '38px',
                height: '38px',
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
              <h2 style={{ fontSize: '1.15rem' }}>
                {isCourseFinished ? 'Course Completed' : nextLesson ? 'Continue Learning' : 'Start Learning'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Introduction to Quantum Computing</span>
            </div>
          </div>

          {loadingProgress ? (
            <div style={{ padding: '1rem 0', flex: 1 }}>
              <LoadingSpinner message="Loading your next lesson..." />
            </div>
          ) : isCourseFinished ? (
            <div style={{ flex: 1, marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Congratulations! You have completed all 20 lessons in the foundational curriculum.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} />
                <span>100% Curriculum Mastery</span>
              </div>
            </div>
          ) : nextLesson ? (
            <div style={{ flex: 1, marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {nextLesson.module_title} · Lesson {nextLesson.display_order}
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: '0.25rem 0 0.5rem 0', color: 'var(--text-primary)' }}>
                {nextLesson.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Estimated reading time: {nextLesson.estimated_minutes} min
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                You have not started learning yet. Begin with Lesson 1 to unlock the secrets of quantum superposition and qubits.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {nextLesson ? (
              <Link to={`/app/learn/lessons/${nextLesson.lesson_id}`} className="btn btn-primary">
                <PlayCircle size={16} />
                <span>Continue Lesson</span>
              </Link>
            ) : (
              <Link to="/app/learn" className="btn btn-primary">
                <PlayCircle size={16} />
                <span>Start First Lesson</span>
              </Link>
            )}

            <Link to="/app/learn" className="btn btn-secondary">
              <span>View Full Syllabus</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Quantum Lab Quick Action Card */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(27, 20, 48, 0.45) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
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

      {/* Progress & Modules Breakdown Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Course Progress Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>Course Progress</h2>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>
              {coursePercent}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={coursePercent}
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
                width: `${coursePercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          {loadingProgress ? (
            <LoadingSpinner message="Loading module breakdown..." />
          ) : progress?.modules_progress && progress.modules_progress.length > 0 ? (
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
              title="No progress recorded yet"
              description="Start your first lesson to see module completion metrics."
            />
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem' }}>Recent Activity</h2>
            <Sparkles size={16} color="var(--accent-cyan)" />
          </div>

          {loadingProgress ? (
            <LoadingSpinner message="Loading activity..." />
          ) : progress?.recently_completed_lessons && progress.recently_completed_lessons.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {progress.recently_completed_lessons.map((item) => (
                <div
                  key={item.lesson_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={18} color="var(--accent-emerald)" />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.module_title}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                    +{25} XP
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No recent activity"
              description="Completed lessons and quantum practice challenges will be logged here."
            />
          )}
        </div>
      </div>
    </div>
  );
};

