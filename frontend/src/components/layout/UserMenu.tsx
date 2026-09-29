import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return 'Q';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user?.display_name || user?.username || 'Learner';

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User account menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.375rem 0.625rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          transition: 'all var(--transition-fast)'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            color: '#04101e',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '0.05em'
          }}
        >
          {getInitials(displayName)}
        </div>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {displayName}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-secondary)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--transition-fast)'
          }}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '240px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '0.5rem',
            zIndex: 50,
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div
            style={{
              padding: '0.75rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '0.5rem'
            }}
          >
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {displayName}
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user?.email}
            </p>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                {user?.experience_level || 'beginner'}
              </span>
            </div>
          </div>

          <Link
            to="/app/profile"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
            className="btn-ghost"
          >
            <User size={16} aria-hidden="true" />
            <span>Profile</span>
          </Link>

          <Link
            to="/app/settings"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
            className="btn-ghost"
          >
            <Settings size={16} aria-hidden="true" />
            <span>Settings</span>
          </Link>

          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '0.5rem',
              paddingTop: '0.5rem'
            }}
          >
            <button
              onClick={handleLogout}
              role="menuitem"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-rose)',
                fontSize: '0.875rem',
                textAlign: 'left'
              }}
              className="btn-ghost"
            >
              <LogOut size={16} aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
