import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertBanner } from '../../components/common/FeedbackStates';
import { Mail, Calendar, Award, Flame, Save, Loader2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level || 'beginner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await updateProfile({
        display_name: displayName.trim() || undefined,
        experience_level: experienceLevel
      });
      setSuccessMsg('Profile updated successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Recently';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>User Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Manage your account information and learning preferences.
        </p>
      </div>

      {successMsg && <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />}
      {errorMsg && <AlertBanner type="error" message={errorMsg} onDismiss={() => setErrorMsg(null)} />}

      <div className="card">
        {/* Profile Header Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
              color: '#04101e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 700,
              boxShadow: 'var(--shadow-glow-cyan)'
            }}
          >
            {(user?.display_name || user?.username || 'Q').slice(0, 2).toUpperCase()}
          </div>

          <div>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>
              {user?.display_name || user?.username}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              @{user?.username}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge badge-cyan">{user?.experience_level || 'beginner'}</span>
              <span className="badge badge-purple">Active Learner</span>
            </div>
          </div>
        </div>

        {/* Read-Only Account Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <Mail size={16} />
              <span>Email Address</span>
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{user?.email}</div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <Calendar size={16} />
              <span>Member Since</span>
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{formattedDate}</div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <Award size={16} />
              <span>Gamification XP</span>
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{user?.points ?? 0} Points</div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <Flame size={16} />
              <span>Streak</span>
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{user?.current_streak_days ?? 1} Days</div>
          </div>
        </div>

        {/* Editable Profile Form */}
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Edit Profile Information</h3>

          <div className="form-group">
            <label htmlFor="profile-display-name" className="form-label">
              Display Name
            </label>
            <input
              id="profile-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
              className="form-input"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-exp-level" className="form-label">
              Quantum Physics & Computing Experience
            </label>
            <select
              id="profile-exp-level"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
              className="form-input"
              disabled={isSubmitting}
              style={{ cursor: 'pointer' }}
            >
              <option value="beginner">Beginner — New to qubits and quantum principles</option>
              <option value="intermediate">Intermediate — Familiar with linear algebra & basic gates</option>
              <option value="advanced">Advanced — Comfortable with algorithms (Grover, Shor, QFT)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
