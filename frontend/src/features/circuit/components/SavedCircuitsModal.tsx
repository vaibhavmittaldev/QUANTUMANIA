import React from 'react';
import { X, FolderOpen, ArrowRight } from 'lucide-react';
import { CanonicalCircuit, SavedCircuit } from '../../../types/circuit';

interface SavedCircuitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuits: SavedCircuit[];
  onSelectCircuit: (circuit: CanonicalCircuit, title: string) => void;
}

export const SavedCircuitsModal: React.FC<SavedCircuitsModalProps> = ({
  isOpen,
  onClose,
  circuits,
  onSelectCircuit
}) => {
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
          border: '1px solid rgba(6, 182, 212, 0.6)',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '8px',
            borderBottom: '1px solid #1e293b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FolderOpen size={16} color="#00F2FE" />
            <h4
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#f1f5f9',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Open Saved Circuit
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="ql-scrollbar"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '280px',
            overflowY: 'auto'
          }}
        >
          {circuits.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 0',
                color: '#64748b',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)'
              }}
            >
              No saved circuits found. Save your current circuit to see it here!
            </div>
          ) : (
            circuits.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelectCircuit(c.canonical, c.title);
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#080c18',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: '12px' }}>
                    {c.title}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#64748b',
                      fontFamily: 'var(--font-mono, monospace)',
                      marginTop: '2px'
                    }}
                  >
                    {c.qubits || c.canonical.qubits} Qubits &bull;{' '}
                    {(c.canonical.gates || c.canonical.operations || []).length} Gates
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00F2FE', fontSize: '11px' }}>
                  <span>Load</span>
                  <ArrowRight size={12} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
