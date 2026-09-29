import React from 'react';
import { Cpu, GraduationCap, Trophy, BarChart3, ArrowLeft, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlaceholderModuleProps {
  moduleId: 'learn' | 'quantum-lab' | 'practice' | 'progress';
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({ moduleId }) => {
  const meta: Record<
    string,
    {
      title: string;
      phase: string;
      owner: string;
      icon: LucideIcon;
      description: string;
      plannedDeliverables: string[];
      accentColor: string;
    }
  > = {
    learn: {
      title: 'Learning Curriculum & Interactive Lessons',
      phase: 'Phase 2',
      owner: 'Vaibhav',
      icon: GraduationCap,
      description: 'The interactive quantum computing curriculum module will be introduced in Phase 2.',
      plannedDeliverables: [
        'Course catalog & structured syllabus tree',
        'Interactive lesson viewer with Markdown & LaTeX formula rendering',
        'Pre-populated starter circuits for single-qubit superpositions and Pauli gates',
        'Lesson completion progress tracking'
      ],
      accentColor: 'var(--accent-cyan)'
    },
    'quantum-lab': {
      title: 'Quantum Circuit Lab Workbench',
      phase: 'Phase 3 — 5',
      owner: 'Tanishq',
      icon: Cpu,
      description:
        'This route is the dedicated integration destination for Tanishq to mount the Quantum Circuit Builder, Simulator Visualizations, and Grounded AI Tutor.',
      plannedDeliverables: [
        'Phase 3: Drag-and-drop circuit canvas supporting X, Y, Z, H, CNOT, and MEASURE gates',
        'Phase 4: Deterministic Python statevector simulator, probability histograms & Bloch sphere projections',
        'Phase 5: Grounded Socratic AI Tutor anchored strictly to verified simulation outputs'
      ],
      accentColor: 'var(--accent-purple)'
    },
    practice: {
      title: 'Algorithm Practice & Quizzes',
      phase: 'Phase 6',
      owner: 'Vaibhav',
      icon: Trophy,
      description: 'Conceptual knowledge check quizzes and algorithmic challenges will be mounted in Phase 6.',
      plannedDeliverables: [
        'Interactive multiple-choice lesson quizzes',
        'Automated quantum circuit grading (e.g. Bell state preparation, Superdense coding)',
        'Fidelity scoring against mathematical target vectors'
      ],
      accentColor: 'var(--accent-emerald)'
    },
    progress: {
      title: 'Learning Analytics & Recommendations',
      phase: 'Phase 6',
      owner: 'Vaibhav',
      icon: BarChart3,
      description: 'Student learning analytics, streak calendars, and personalized topic recommendations.',
      plannedDeliverables: [
        'Comprehensive XP breakdown and milestone badges',
        'Topic mastery heatmaps',
        'AI-driven remedial recommendations based on quiz accuracy'
      ],
      accentColor: '#38bdf8'
    }
  };

  const item = meta[moduleId] || meta.learn;
  const IconComponent = item.icon;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/app/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${item.accentColor}`,
              color: item.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 15px ${item.accentColor}33`
            }}
          >
            <IconComponent size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-purple">{item.phase}</span>
              <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>
                Owner: {item.owner}
              </span>
            </div>
            <h1 style={{ fontSize: '1.5rem' }}>{item.title}</h1>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          {item.description}
        </p>

        <div
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Architecture & Contract Foundation Established
          </h2>
          <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {item.plannedDeliverables.map((deliv, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: item.accentColor,
                    marginTop: '0.5rem',
                    flexShrink: 0
                  }}
                />
                <span>{deliv}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/app/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
          <Link to="/app/profile" className="btn btn-secondary">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};
