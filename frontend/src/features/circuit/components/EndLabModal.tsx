import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface EndLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const EndLabModal: React.FC<EndLabModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#0e1428',
          border: '1px solid rgba(244, 63, 94, 0.6)',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '380px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
          <AlertTriangle size={18} />
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>End Lab Session?</h4>
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
          Your circuit modifications and progress will be saved to your learner profile before exiting to the learning path.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '6px',
              backgroundColor: '#e11d48',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Save &amp; End Lab
          </button>
        </div>
      </div>
    </div>
  );
};
