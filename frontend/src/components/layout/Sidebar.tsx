import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MAIN_NAV_ITEMS, ACCOUNT_NAV_ITEMS } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';
import { LogOut, X, Atom } from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    onCloseMobile();
  };

  const navContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        width: 'var(--sidebar-width)',
        padding: '1.25rem 1rem'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          padding: '0 0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#04101e',
              boxShadow: 'var(--shadow-glow-cyan)'
            }}
          >
            <Atom size={22} aria-hidden="true" />
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.15rem',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 40%, var(--accent-cyan) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              QUANTUMANIA
            </span>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Learning Platform
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="mobile-close-btn"
          aria-label="Close navigation menu"
          style={{
            color: 'var(--text-secondary)',
            display: 'none',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.75rem', overflowY: 'auto' }}>
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '0 0.75rem',
              marginBottom: '0.5rem'
            }}
          >
            Core Learning
          </div>
          <nav aria-label="Main Navigation" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--accent-cyan-subtle)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem',
                    transition: 'all var(--transition-fast)'
                  })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  {item.phaseTag && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {item.phaseTag}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Account Section */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              padding: '0 0.75rem',
              marginBottom: '0.5rem'
            }}
          >
            Preferences
          </div>
          <nav aria-label="Account Navigation" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {ACCOUNT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--accent-cyan-subtle)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem',
                    transition: 'all var(--transition-fast)'
                  })}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Logout */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1rem',
          marginTop: '1rem'
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-rose)',
            fontSize: '0.9rem',
            transition: 'background var(--transition-fast)'
          }}
          className="btn-ghost"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="desktop-sidebar" style={{ display: 'block' }}>
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop and Aside */}
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        />
      )}
      <div
        className={`mobile-drawer ${mobileOpen ? 'mobile-drawer-open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform var(--transition-normal)'
        }}
      >
        {navContent}
      </div>
    </>
  );
};
