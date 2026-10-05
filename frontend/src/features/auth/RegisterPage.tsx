import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';
import { AlertBanner } from '../../components/common/FeedbackStates';
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';
import { QVerseLogo } from '../../components/common/QVerseLogo';
import { useDocumentTitle } from '../../components/common/useDocumentTitle';

export const RegisterPage: React.FC = () => {
  useDocumentTitle('Create Account');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername) {
      setError('Please choose a username.');
      return;
    }
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, underscores, and dashes.');
      return;
    }
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please choose a password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(cleanEmail, cleanUsername, password, displayName.trim() || undefined);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'ACCOUNT_ALREADY_EXISTS') {
          setError('An account with this email or username already exists.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred during registration. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--bg-base)',
        padding: '1.5rem'
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          <QVerseLogo variant="full" height={44} />
        </Link>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.75rem' }}>
          Create an account to unlock interactive quantum algorithm labs in QVerse
        </p>
      </div>

      {/* Registration Card */}
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>Create Your Account</h2>

        {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="reg-username" className="form-label">
                Username <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="q_coder"
                className="form-input"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-display-name" className="form-label">
                Full Name (Optional)
              </label>
              <input
                id="reg-display-name"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
                className="form-input"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">
              Email Address <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="learner@example.com"
              className="form-input"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">
              Password (min. 8 chars) <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="form-input"
                style={{ paddingRight: '2.5rem' }}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm-password" className="form-label">
              Confirm Password <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              id="reg-confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="form-input"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};
