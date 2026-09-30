/**
 * QUANTUMANIA - Circuit Reset Confirmation Modal
 * Phase 3: Quantum Circuit Builder
 */

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Reset Circuit Canvas?',
  description = 'All placed quantum gates and measurement operations will be cleared. This action can still be undone with Ctrl+Z.'
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertCircle size={20} />
          </div>
          <div>
            <h2 id="reset-modal-title" style={{ fontSize: '1.1rem' }}>
              {title}
            </h2>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-primary"
            style={{
              backgroundColor: 'var(--accent-rose)',
              borderColor: 'var(--accent-rose)'
            }}
          >
            <RotateCcw size={16} />
            <span>Reset Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
