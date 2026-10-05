import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, FileCode2 } from 'lucide-react';
import { CanonicalCircuit } from '../../../types/circuit';
import { quantumApi } from '../../../services/api';
import { generateQuantumCode } from '../domain/codeGenerator';

interface MonacoSyncEditorProps {
  circuit: CanonicalCircuit;
  onCodeSyncedCircuit: (updatedCircuit: CanonicalCircuit) => void;
}

export const MonacoSyncEditor: React.FC<MonacoSyncEditorProps> = ({
  circuit,
  onCodeSyncedCircuit
}) => {
  const [code, setCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const debounceTimerRef = useRef<any>(null);
  const isInternalUpdate = useRef<boolean>(false);

  // Sync canvas changes into code automatically
  useEffect(() => {
    let isMounted = true;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    quantumApi
      .toQiskit(circuit)
      .then((res) => {
        if (isMounted && res && res.code) {
          setCode(res.code);
          setSyncStatus('synced');
        }
      })
      .catch(() => {
        // Local generator fallback
        if (isMounted) {
          const fallbackCode = generateQuantumCode(circuit).code;
          setCode(fallbackCode);
          setSyncStatus('synced');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [circuit]);

  // Handle manual code editing and bidirectional sync back to canvas
  const handleEditorChange = (newCode: string | undefined) => {
    if (!newCode) return;
    setCode(newCode);
    setSyncStatus('syncing');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      quantumApi
        .fromQiskit(newCode)
        .then((res) => {
          if (res && res.circuit) {
            isInternalUpdate.current = true;
            onCodeSyncedCircuit(res.circuit);
            setSyncStatus('synced');
          } else {
            setSyncStatus('error');
          }
        })
        .catch(() => {
          setSyncStatus('error');
        });
    }, 600);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('qverse-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'e2e8f0', background: '070a13' },
        { token: 'comment', foreground: '5c7f82', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'f1f5f9' },
        { token: 'type', foreground: '2dd4bf' },
        { token: 'string', foreground: 'fde047' },
        { token: 'number', foreground: 'c084fc' },
        { token: 'delimiter', foreground: '94a3b8' },
        { token: 'operator', foreground: '94a3b8' }
      ],
      colors: {
        'editor.background': '#070a13',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#0d1527',
        'editor.selectionBackground': '#1e293b99',
        'editorLineNumber.foreground': '#334155',
        'editorLineNumber.activeForeground': '#00f2fe',
        'editorCursor.foreground': '#00f2fe',
        'editorIndentGuide.background1': '#131c31',
        'editorIndentGuide.activeBackground1': '#223254',
        'editorBracketMatch.background': '#0284c733',
        'editorBracketMatch.border': '#38bdf866',
        'scrollbarSlider.background': '#38bdf81a',
        'scrollbarSlider.hoverBackground': '#38bdf833',
        'scrollbarSlider.activeBackground': '#38bdf866'
      }
    });
  };

  return (
    <div
      className="qverse-monaco-ide-panel"
      style={{
        width: '350px',
        maxWidth: '100%',
        backgroundColor: '#070a13',
        border: '1px solid #131c31',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        flexShrink: 0
      }}
    >
      {/* Professional IDE Toolbar Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          backgroundColor: '#070a13',
          borderBottom: '1px solid #131c31'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '5px',
              backgroundColor: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.22)',
              color: '#00F2FE'
            }}
          >
            <FileCode2 size={13} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#f1f5f9',
                fontFamily: 'var(--font-mono, monospace)'
              }}
            >
              Qiskit Code
            </span>
            <span
              style={{
                fontSize: '10px',
                color: '#64748b',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 500
              }}
            >
              Python &middot; Aer
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Refined Sync Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '12px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 500,
              backgroundColor:
                syncStatus === 'synced'
                  ? 'rgba(6, 78, 59, 0.35)'
                  : syncStatus === 'syncing'
                    ? 'rgba(120, 53, 15, 0.35)'
                    : 'rgba(136, 19, 55, 0.35)',
              color:
                syncStatus === 'synced'
                  ? '#34d399'
                  : syncStatus === 'syncing'
                    ? '#fbbf24'
                    : '#f87171',
              border:
                syncStatus === 'synced'
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : syncStatus === 'syncing'
                    ? '1px solid rgba(245, 158, 11, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor:
                  syncStatus === 'synced'
                    ? '#10b981'
                    : syncStatus === 'syncing'
                      ? '#f59e0b'
                      : '#ef4444',
                display: 'inline-block'
              }}
            />
            <span>{syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Parse Err'}</span>
          </div>

          {/* Copy Action Button */}
          <button
            type="button"
            onClick={copyCode}
            className="qverse-editor-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '5px',
              backgroundColor: copied ? 'rgba(6, 78, 59, 0.4)' : '#0d1527',
              color: copied ? '#34d399' : '#94a3b8',
              border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.4)' : '#1e293b'}`,
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)'
            }}
            title="Copy Qiskit Code to Clipboard"
            aria-label="Copy Qiskit code"
          >
            {copied ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Embedded Monaco Editor */}
      <div style={{ flex: 1, minHeight: '360px' }}>
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="qverse-dark"
          beforeMount={handleEditorWillMount}
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 10, bottom: 10 },
            overviewRulerBorder: false,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true }
          }}
        />
      </div>

      {/* Editor Footer / Status Bar */}
      <div
        style={{
          padding: '6px 12px',
          backgroundColor: '#070a13',
          borderTop: '1px solid #131c31',
          fontSize: '10px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono, monospace)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#00F2FE' }}>&bull;</span>
          <span>Python 3.14 &middot; Qiskit Aer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{circuit.qubits ?? 2}Q</span>
          <span>&bull;</span>
          <span>Depth {circuit.depth !== undefined ? circuit.depth : (circuit.gates || []).length}</span>
          <span>&bull;</span>
          <span style={{ color: '#38bdf8' }}>AST Sync</span>
        </div>
      </div>
    </div>
  );
};
