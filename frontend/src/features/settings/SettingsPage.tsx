import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Moon, Bell, LogOut, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Configure appearance, security, and application preferences.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Moon size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.2rem' }}>Appearance & Theme</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          QUANTUMANIA utilizes an educational dark mode optimized for visual clarity on circuit lines and Hilbert space representations.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--accent-cyan)',
              backgroundColor: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'default'
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-cyan)',
                color: '#04101e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Check size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Quantum Dark (Default)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High-contrast slate & neon cyan</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Active Session */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Shield size={20} color="var(--accent-emerald)" />
          <h2 style={{ fontSize: '1.2rem' }}>Security & Authentication Session</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Session Type</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>JWT Bearer Token with HS256 encryption</div>
            </div>
            <span className="badge badge-emerald">Active</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Account ID</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{user?.user_id}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Log Out All Devices</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Terminate current session on this browser</div>
            </div>
            <button onClick={logout} className="btn btn-secondary" style={{ color: 'var(--accent-rose)' }}>
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Section (Placeholder for Phase 6) */}
      <div className="card" style={{ opacity: 0.75 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bell size={20} color="var(--text-muted)" />
            <h2 style={{ fontSize: '1.2rem' }}>Notification Preferences</h2>
          </div>
          <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)' }}>
            Phase 6
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Email digests and streak alerts will become configurable in Phase 6 (Assessment + Progress).
        </p>
      </div>
    </div>
  );
};
