import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Info, Inbox } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string; fullScreen?: boolean }> = ({
  message = 'Loading...',
  fullScreen = false
}) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}
    >
      <Loader2
        size={36}
        className="animate-spin"
        style={{ color: 'var(--accent-cyan)' }}
        aria-hidden="true"
      />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-base)'
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export const AlertBanner: React.FC<{
  type: 'error' | 'success' | 'info';
  message: string;
  onDismiss?: () => void;
}> = ({ type, message, onDismiss }) => {
  const styles = {
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      color: '#fca5a5',
      icon: AlertCircle
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      color: '#86efac',
      icon: CheckCircle
    },
    info: {
      bg: 'rgba(0, 242, 254, 0.1)',
      border: 'rgba(0, 242, 254, 0.3)',
      color: '#7dd3fc',
      icon: Info
    }
  }[type];

  const IconComponent = styles.icon;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.color,
        fontSize: '0.9rem',
        marginBottom: '1rem'
      }}
    >
      <IconComponent size={18} style={{ flexShrink: 0 }} aria-hidden="true" />
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            color: 'inherit',
            opacity: 0.7,
            padding: '2px',
            lineHeight: 1
          }}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        border: '1px dashed var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'rgba(17, 24, 39, 0.4)'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: 'var(--text-muted)'
        }}
      >
        <Inbox size={28} aria-hidden="true" />
      </div>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          maxWidth: '400px',
          marginBottom: actionText ? '1.25rem' : 0
        }}
      >
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-secondary">
          {actionText}
        </button>
      )}
    </div>
  );
};
