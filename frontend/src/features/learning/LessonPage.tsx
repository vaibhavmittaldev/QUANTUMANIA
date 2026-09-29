import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { learningApi, ApiError } from '../../services/api';
import { LessonDetail, CourseDetail } from '../../types/learning';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { LoadingSpinner, AlertBanner } from '../../components/common/FeedbackStates';
import {
  CheckCircle,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Target,
  Cpu,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export const LessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  const navigate = useNavigate();

  // Load lesson and course syllabus
  useEffect(() => {
    if (!lessonId) return;
    let isMounted = true;

    const loadLessonData = async () => {
      setIsLoading(true);
      setError(null);
      setFeedback(null);

      try {
        const [lessonData, courseData] = await Promise.all([
          learningApi.getLesson(lessonId),
          learningApi.getCourse('crs_intro_quantum')
        ]);

        if (isMounted) {
          setLesson(lessonData);
          setCourse(courseData);
          // Record lesson start
          learningApi.startLesson(lessonId).catch(() => {});
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('Failed to load lesson content.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadLessonData();

    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  const handleComplete = async () => {
    if (!lessonId || isCompleting || !lesson) return;
    setIsCompleting(true);
    try {
      const res = await learningApi.completeLesson(lessonId);
      setLesson((prev) => (prev ? { ...prev, is_completed: true } : null));

      if (res.xp_awarded > 0) {
        setFeedback(`Lesson completed! +${res.xp_awarded} XP earned.`);
      } else {
        setFeedback('Lesson completed!');
      }

      // Update local course completion state
      if (course) {
        setCourse((prevCourse) => {
          if (!prevCourse) return null;
          return {
            ...prevCourse,
            modules: prevCourse.modules.map((m) => ({
              ...m,
              lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, is_completed: true } : l))
            }))
          };
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update lesson completion.');
      }
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading lesson content..." />;
  }

  if (error || !lesson) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <AlertBanner type="error" message={error || 'Lesson not found.'} />
        <Link to="/app/learn" className="btn btn-secondary">
          Return to Course
        </Link>
      </div>
    );
  }

  // Sidebar Course Navigation Tree
  const syllabusNav = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1rem',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={18} color="var(--accent-cyan)" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Course Syllabus</span>
        </div>
        <button
          onClick={() => setNavDrawerOpen(false)}
          className="mobile-close-btn"
          aria-label="Close syllabus menu"
          style={{ color: 'var(--text-muted)', display: 'none' }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {course?.modules.map((mod) => (
          <div key={mod.id}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--accent-purple)',
                marginBottom: '0.4rem',
                paddingLeft: '0.25rem'
              }}
            >
              {mod.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {mod.lessons.map((l) => {
                const isActive = l.id === lesson.id;
                return (
                  <Link
                    key={l.id}
                    to={`/app/learn/lessons/${l.id}`}
                    onClick={() => setNavDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.6rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      backgroundColor: isActive ? 'var(--accent-cyan-subtle)' : 'transparent',
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 600 : 400,
                      borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: l.is_completed ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.08)',
                        color: l.is_completed ? '#04101e' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {l.is_completed ? '✓' : l.display_order}
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Breadcrumb & Mobile Drawer Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link to="/app/learn" style={{ color: 'var(--text-secondary)' }}>
            Course
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{lesson.module_title}</span>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{lesson.title}</span>
        </nav>

        {/* Mobile Syllabus Toggle */}
        <button
          onClick={() => setNavDrawerOpen(!navDrawerOpen)}
          className="btn btn-secondary mobile-hamburger-btn"
          style={{ display: 'none', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
        >
          <Menu size={16} />
          <span>Syllabus</span>
        </button>
      </div>

      {/* Main Grid: Syllabus Sidebar + Lesson Content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '2rem',
          alignItems: 'start'
        }}
        className="lesson-viewer-layout"
      >
        {/* Desktop Syllabus Column */}
        <aside
          className="desktop-syllabus"
          style={{
            position: 'sticky',
            top: 'calc(var(--topbar-height) + 1.5rem)',
            maxHeight: 'calc(100vh - var(--topbar-height) - 3rem)'
          }}
        >
          {syllabusNav}
        </aside>

        {/* Mobile Slide-Over Syllabus Drawer */}
        {navDrawerOpen && (
          <div
            className="mobile-backdrop"
            onClick={() => setNavDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 90
            }}
          />
        )}
        <div
          className={`mobile-drawer ${navDrawerOpen ? 'mobile-drawer-open' : ''}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '300px',
            zIndex: 100,
            transform: navDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform var(--transition-normal)'
          }}
        >
          {syllabusNav}
        </div>

        {/* Main Lesson Content Column */}
        <article className="card" style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)', display: 'flex', flexDirection: 'column' }}>
          {feedback && <AlertBanner type="success" message={feedback} onDismiss={() => setFeedback(null)} />}

          {/* Lesson Header */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-purple">{lesson.module_title}</span>
              <span className="badge badge-cyan">{lesson.difficulty}</span>
              <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' }}>
                <Clock size={12} style={{ marginRight: '4px' }} />
                {lesson.estimated_minutes} min read
              </span>
              <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: 'var(--accent-emerald)' }}>
                <Award size={12} style={{ marginRight: '4px' }} />
                +{lesson.xp_reward} XP
              </span>
              {lesson.is_completed && (
                <span className="badge badge-emerald">
                  <CheckCircle size={12} style={{ marginRight: '4px' }} />
                  Completed
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              {lesson.title}
            </h1>

            {lesson.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
                {lesson.description}
              </p>
            )}
          </div>

          {/* Learning Objectives Box */}
          {lesson.objectives && lesson.objectives.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                <Target size={18} />
                <span>Learning Objectives</span>
              </div>
              <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lesson.objectives.map((obj, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', marginTop: '0.5rem', flexShrink: 0 }} />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Structured Content Blocks */}
          <div style={{ marginBottom: '2.5rem' }}>
            {lesson.content_blocks.map((block, idx) => (
              <ContentBlockRenderer key={idx} block={block} />
            ))}
          </div>

          {/* Interactive Quantum Lab Integration Card (Tanishq's Phase 3-5 Connection) */}
          {lesson.interactive && (
            <div
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(27, 20, 48, 0.5) 100%)',
                marginBottom: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.5rem',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent-purple-subtle)',
                    color: 'var(--accent-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-glow-purple)'
                  }}
                >
                  <Cpu size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                      Interactive Quantum Lab
                    </span>
                    <Sparkles size={14} color="var(--accent-cyan)" />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    Hands-On Circuit Simulation
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Launch this lesson's circuit template into the Quantum Lab workbench to experiment with gate parameters.
                  </p>
                </div>
              </div>

              <Link to="/app/quantum-lab" className="btn btn-primary">
                <span>{lesson.interactive.label || 'Open in Quantum Lab'}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* Action Footer Navigation */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '2rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            {/* Previous Button */}
            {lesson.navigation.previous_lesson_id ? (
              <button
                onClick={() => navigate(`/app/learn/lessons/${lesson.navigation.previous_lesson_id}`)}
                className="btn btn-secondary"
              >
                <ChevronLeft size={18} />
                <span>Previous Lesson</span>
              </button>
            ) : (
              <div />
            )}

            {/* Mark Complete Button */}
            <button
              onClick={handleComplete}
              disabled={isCompleting || lesson.is_completed}
              className={`btn ${lesson.is_completed ? 'btn-secondary' : 'btn-primary'}`}
              style={{
                color: lesson.is_completed ? 'var(--accent-emerald)' : undefined,
                borderColor: lesson.is_completed ? 'rgba(16, 185, 129, 0.4)' : undefined
              }}
            >
              <CheckCircle size={18} />
              <span>{lesson.is_completed ? 'Completed ✓' : isCompleting ? 'Saving...' : 'Mark Lesson Complete'}</span>
            </button>

            {/* Next Button */}
            {lesson.navigation.next_lesson_id ? (
              <button
                onClick={() => navigate(`/app/learn/lessons/${lesson.navigation.next_lesson_id}`)}
                className="btn btn-primary"
              >
                <span>Next Lesson</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <Link to="/app/learn" className="btn btn-secondary">
                <span>Course Completed ✓</span>
              </Link>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};
