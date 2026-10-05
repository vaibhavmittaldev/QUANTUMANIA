import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { Menu, Bell } from 'lucide-react';

interface TopbarProps {
  onToggleMobile: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobile }) => {
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname.includes('/app/dashboard')) return 'Dashboard';
    if (pathname.includes('/app/learn')) return 'Learning Curriculum';
    if (pathname.includes('/app/quantum-lab')) return 'Quantum Circuit Lab';
    if (pathname.includes('/app/practice')) return 'Algorithm Practice';
    if (pathname.includes('/app/progress')) return 'Progress & Analytics';
    if (pathname.includes('/app/profile')) return 'User Profile';
    if (pathname.includes('/app/settings')) return 'Settings';
    return 'Platform';
  };

  const title = getPageTitle(location.pathname);

  useEffect(() => {
    document.title = `QVerse — ${title}`;
  }, [title]);

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--bg-surface-translucent)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleMobile}
          className="mobile-hamburger-btn"
          aria-label="Open mobile menu"
          style={{
            display: 'none',
            color: 'var(--text-secondary)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Menu size={22} />
        </button>

        <div>
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Platform</span>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{title}</span>
          </nav>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Notifications Icon (Placeholder for future phases) */}
        <button
          aria-label="Notifications (No new notifications)"
          title="Notifications"
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)'
          }}
          className="btn-ghost"
        >
          <Bell size={18} aria-hidden="true" />
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-cyan)'
            }}
          />
        </button>

        {/* User Account Menu */}
        <UserMenu />
      </div>
    </header>
  );
};
