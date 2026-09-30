import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { learningApi, ApiError } from '../../services/api';
import { ModuleSummary } from '../../types/learning';
import { LoadingSpinner, AlertBanner } from '../../components/common/FeedbackStates';
import { ArrowLeft, CheckCircle, Clock, Award, ArrowRight, Play } from 'lucide-react';

export const ModulePage: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [module, setModule] = useState<ModuleSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleId) return;
    const fetchModule = async () => {
      try {
        const data = await learningApi.getModule(moduleId);
        setModule(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load module outline.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchModule();
  }, [moduleId]);

  if (isLoading) {
    return <LoadingSpinner message="Loading module outline..." />;
  }

  if (error || !module) {
    return (
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <AlertBanner type="error" message={error || 'Module not found.'} />
        <Link to="/app/learn" className="btn btn-secondary">
          Return to Course
        </Link>
      </div>
    );
  }

  const firstIncomplete = module.lessons.find((l) => !l.is_completed) || module.lessons[0];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Back to Course Navigation */}
      <div>
        <Link
          to="/app/learn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to All Modules</span>
        </Link>
      </div>

      {/* Module Header Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-purple">Module {module.display_order}</span>
          {module.progress_percent === 100 && (
            <span className="badge badge-emerald">Completed ✓</span>
          )}
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{module.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {module.description}
        </p>

        {/* Progress & Metrics */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Progress</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {module.completed_lessons} of {module.total_lessons} Lessons Completed ({module.progress_percent}%)
            </div>
          </div>

          {firstIncomplete && (
            <Link to={`/app/learn/lessons/${firstIncomplete.id}`} className="btn btn-primary">
              <Play size={16} />
              <span>{module.completed_lessons > 0 ? 'Continue Module' : 'Start Module'}</span>
            </Link>
          )}
        </div>

        {/* Lessons List */}
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Lessons in this Module</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {module.lessons.map((les) => (
            <Link
              key={les.id}
              to={`/app/learn/lessons/${les.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none'
              }}
              className="card-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: les.is_completed ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.08)',
                    color: les.is_completed ? '#04101e' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  {les.is_completed ? <CheckCircle size={18} /> : les.display_order}
                </div>

                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {les.title}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} />
                      {les.estimated_minutes} min
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Award size={12} />
                      {les.xp_reward} XP
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                      {les.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                {les.is_completed && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 500 }}>
                    Completed
                  </span>
                )}
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
