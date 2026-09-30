/**
 * QUANTUMANIA - Canonical Circuit JSON Code View & Import Modal
 * Phase 3: Quantum Circuit Builder
 */

import React, { useState } from 'react';
import { useCircuit } from '../context/CircuitContext';
import { serializeCircuit, deserializeCircuit } from '../domain/circuitDomain';
import { X, Copy, Check, Download, Upload } from 'lucide-react';

interface CircuitCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CircuitCodeModal: React.FC<CircuitCodeModalProps> = ({ isOpen, onClose }) => {
  const { circuit, loadCircuit } = useCircuit();
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const serialized = serializeCircuit(circuit);

  const handleCopy = () => {
    navigator.clipboard.writeText(serialized);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    setImportError(null);
    const res = deserializeCircuit(importJson);
    if (res.error) {
      setImportError(res.error);
      return;
    }
    if (res.circuit) {
      loadCircuit(res.circuit);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="circuit-code-title"
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
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 id="circuit-code-title" style={{ fontSize: '1.15rem' }}>
              Canonical Circuit Representation
            </h2>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
              Schema v1.0.0
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close dialog"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setTab('export')}
            className="btn btn-secondary"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.8rem',
              borderColor: tab === 'export' ? 'var(--accent-cyan)' : 'var(--border-light)',
              backgroundColor: tab === 'export' ? 'rgba(6, 182, 212, 0.12)' : 'transparent'
            }}
          >
            <Download size={14} />
            <span>Export JSON (Phase 4 Contract)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('import')}
            className="btn btn-secondary"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.8rem',
              borderColor: tab === 'import' ? 'var(--accent-cyan)' : 'var(--border-light)',
              backgroundColor: tab === 'import' ? 'rgba(6, 182, 212, 0.12)' : 'transparent'
            }}
          >
            <Upload size={14} />
            <span>Import JSON</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ marginTop: '0.75rem', flex: 1, overflowY: 'auto' }}>
          {tab === 'export' ? (
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                This JSON payload adheres strictly to <code>docs/QUANTUM_SCHEMA.md</code> and will be consumed by Tanishq's Phase 4 simulator:
              </p>
              <pre
                style={{
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: 'var(--accent-cyan)',
                  maxHeight: '380px',
                  overflow: 'auto',
                  margin: 0
                }}
              >
                <code>{serialized}</code>
              </pre>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Paste a valid <code>CanonicalCircuit</code> JSON payload to load it into the circuit workspace:
              </p>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{\n  "schema_version": "1.0.0",\n  "qubits": 2,\n  "gates": [...]\n}'
                rows={12}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
              {importError && (
                <div style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  ⚠️ {importError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
            marginTop: '0.75rem'
          }}
        >
          {tab === 'export' ? (
            <button type="button" onClick={handleCopy} className="btn btn-primary">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Circuit JSON'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleImport}
              disabled={!importJson.trim()}
              className="btn btn-primary"
            >
              <Upload size={16} />
              <span>Load into Workspace</span>
            </button>
          )}

          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
