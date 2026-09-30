import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { learningApi, ApiError } from '../../services/api';
import { CourseDetail } from '../../types/learning';
import { LoadingSpinner, AlertBanner } from '../../components/common/FeedbackStates';
import { BookOpen, Clock, Award, CheckCircle, ArrowRight, Play, Sparkles, Search } from 'lucide-react';

export const CoursePage: React.FC = () => {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await learningApi.getCourse('crs_intro_quantum');
        setCourse(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load course information.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading quantum curriculum..." />;
  }

  if (error || !course) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <AlertBanner type="error" message={error || 'Course not available.'} />
        <Link to="/app/dashboard" className="btn btn-secondary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Filter modules based on search query
  const filteredModules = course.modules.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = m.title.toLowerCase().includes(q);
    const descMatch = (m.description || '').toLowerCase().includes(q);
    const lessonMatch = m.lessons.some((l) => l.title.toLowerCase().includes(q));
    return titleMatch || descMatch || lessonMatch;
  });

  // Find first incomplete lesson to resume
  let nextIncompleteLessonId: string | null = null;
  for (const mod of course.modules) {
    for (const les of mod.lessons) {
      if (!les.is_completed) {
        nextIncompleteLessonId = les.id;
        break;
      }
    }
    if (nextIncompleteLessonId) break;
  }
  // Default to lesson 1 if all complete or not started
  const targetLessonId = nextIncompleteLessonId || course.modules[0]?.lessons[0]?.id || 'les_01_what_is_qc';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Course Banner */}
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
            right: '-30px',
            top: '-30px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-cyan-subtle) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span className="badge badge-cyan">{course.difficulty} Track</span>
            <span className="badge badge-purple">SIH 2026 Core Curriculum</span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            {course.title}
          </h1>

          <p style={{ color: 'var(--text-secondary)', maxWidth: '750px', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {course.description}
          </p>

          {/* Quick Metrics */}
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="var(--accent-cyan)" />
              <span>{course.estimated_hours} Hours Total</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={16} color="var(--accent-purple)" />
              <span>{course.total_modules} Modules ({course.total_lessons} Lessons)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={16} color="var(--accent-emerald)" />
              <span>{course.completed_lessons} / {course.total_lessons} Completed</span>
            </div>
          </div>

          {/* Course Progress Bar */}
          <div style={{ maxWidth: '600px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Overall Course Progress</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{course.progress_percent}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${course.progress_percent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease-out'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to={`/app/learn/lessons/${targetLessonId}`} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              <Play size={18} />
              <span>{course.completed_lessons > 0 ? 'Resume Learning' : 'Start First Lesson'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>Course Modules</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Progress through theoretical foundations, multi-qubit systems, and quantum algorithms.
          </p>
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons or topics..."
            className="form-input"
            style={{ paddingLeft: '2.4rem', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {/* Modules List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filteredModules.map((m) => (
          <div key={m.id} className="card card-hover" style={{ padding: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
                marginBottom: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    Module {m.display_order}
                  </span>
                  {m.progress_percent === 100 && (
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      Completed ✓
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>{m.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '700px' }}>
                  {m.description}
                </p>
              </div>

              <div style={{ textAlign: 'right', minWidth: '120px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {m.completed_lessons} / {m.total_lessons} Lessons
                </span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {m.progress_percent}%
                </div>
              </div>
            </div>

            {/* Module Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '4px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
                marginBottom: '1.25rem'
              }}
            >
              <div
                style={{
                  width: `${m.progress_percent}%`,
                  height: '100%',
                  backgroundColor: 'var(--accent-cyan)',
                  borderRadius: 'var(--radius-full)'
                }}
              />
            </div>

            {/* Lessons Accordion / Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '0.75rem'
              }}
            >
              {m.lessons.map((les) => (
                <Link
                  key={les.id}
                  to={`/app/learn/lessons/${les.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="card-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: les.is_completed ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.08)',
                        color: les.is_completed ? '#04101e' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {les.is_completed ? <CheckCircle size={14} /> : les.display_order}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          color: les.is_completed ? 'var(--text-primary)' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span>{les.title}</span>
                        {les.has_interactive_circuit && (
                          <span title="Includes Interactive Quantum Lab">
                            <Sparkles size={12} color="var(--accent-cyan)" />
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {les.estimated_minutes} min · {les.xp_reward} XP
                      </span>
                    </div>
                  </div>

                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
