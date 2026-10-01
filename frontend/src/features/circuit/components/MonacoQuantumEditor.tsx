/**
 * QUANTUMANIA - Monaco Quantum Code Editor
 * Native Quantum Lab Theme Integration
 * Bidirectionally synchronized with Canonical Circuit representation.
 * Supports Python Quantum DSL (Qiskit-compatible syntax) with:
 * - Bespoke Quantum Lab Theme (Deep navy #0a0f1d, cyan & purple accents)
 * - Cohesive typography, panel hierarchy, and cards matching the Lab
 * - Autocompletion for quantum operations
 * - Hover tooltips & matrix explanations
 * - Monaco inline error markers & diagnostics
 * - Line-to-gate bidirectional selection
 * - Safe invalid code handling with 280ms debounce
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { Monaco, OnMount, OnChange, BeforeMount } from '@monaco-editor/react';
import { useCircuit } from '../context/CircuitContext';
import { generateQuantumCode } from '../domain/codeGenerator';
import { parseQuantumCode } from '../domain/codeParser';
import { QUANTUM_DSL_OPS, DslDiagnostic, CodeSourceMap } from '../domain/dslTypes';
import { Copy, Check, Play, RefreshCw, AlertCircle, Terminal } from 'lucide-react';

// Global flag to prevent duplicate Monaco provider registrations across mounts
let monacoProvidersRegistered = false;

// Theme definition for Monaco matching the Quantum Lab Design Tokens
const defineQuantumTheme = (monaco: Monaco) => {
  monaco.editor.defineTheme('quantum-lab-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'a855f7', fontStyle: 'bold' },
      { token: 'identifier', foreground: 'f9fafb' },
      { token: 'type', foreground: '00f2fe', fontStyle: 'bold' },
      { token: 'function', foreground: '00f2fe' },
      { token: 'number', foreground: '38bdf8' },
      { token: 'string', foreground: '10b981' },
      { token: 'operator', foreground: '9ca3af' },
      { token: 'delimiter', foreground: '6b7280' }
    ],
    colors: {
      // Editor Surface matching canvas workspace (#0a0f1d / deep quantum navy)
      'editor.background': '#0a0f1d',
      'editor.foreground': '#f9fafb',
      'editorLineNumber.foreground': '#4b5563',
      'editorLineNumber.activeForeground': '#00f2fe',
      'editorGutter.background': '#0a0f1d',
      'editor.lineHighlightBackground': '#11182788',
      'editor.lineHighlightBorder': '#00000000',
      'editorCursor.foreground': '#00f2fe',
      'editor.selectionBackground': '#00f2fe26',
      'editor.inactiveSelectionBackground': '#00f2fe12',
      'editor.selectionHighlightBackground': '#00f2fe18',
      'scrollbarSlider.background': 'rgba(255, 255, 255, 0.08)',
      'scrollbarSlider.hoverBackground': 'rgba(0, 242, 254, 0.25)',
      'scrollbarSlider.activeBackground': 'rgba(0, 242, 254, 0.45)',
      // Popups and widgets matching Lab elevated surface
      'editorWidget.background': '#111827',
      'editorWidget.border': 'rgba(255, 255, 255, 0.16)',
      'editorSuggestWidget.background': '#111827',
      'editorSuggestWidget.border': 'rgba(255, 255, 255, 0.16)',
      'editorSuggestWidget.selectedBackground': 'rgba(0, 242, 254, 0.15)',
      'editorSuggestWidget.highlightForeground': '#00f2fe',
      'editorSuggestWidget.foreground': '#f9fafb',
      'editorHoverWidget.background': '#111827',
      'editorHoverWidget.border': 'rgba(255, 255, 255, 0.16)',
      'editorHoverWidget.foreground': '#f9fafb'
    }
  });
};

interface MonacoQuantumEditorProps {
  height?: string | number;
  readOnly?: boolean;
}

export const MonacoQuantumEditor: React.FC<MonacoQuantumEditorProps> = ({
  height = '100%',
  readOnly = false
}) => {
  const {
    circuit,
    loadCircuit,
    circuitSource,
    selectedGateId,
    setHighlightedGateId,
    setHighlightedLineNumber
  } = useCircuit();

  const [code, setCode] = useState<string>(() => generateQuantumCode(circuit).code);
  const [diagnostics, setDiagnostics] = useState<DslDiagnostic[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // References
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);
  const initialGen = generateQuantumCode(circuit);
  const sourceMapRef = useRef<CodeSourceMap>({
    gateIdToLine: initialGen.gateIdToLine,
    lineToGateId: initialGen.lineToGateId
  });
  const isInternalChangeRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<any>(null);

  // Helper to set error markers on the Monaco model
  const setEditorMarkers = useCallback((monaco: Monaco, editor: any, diags: DslDiagnostic[]) => {
    const model = editor.getModel();
    if (!model) return;

    const markers = diags.map((d) => ({
      severity:
        d.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Error,
      startLineNumber: d.line,
      startColumn: d.startColumn || 1,
      endLineNumber: d.line,
      endColumn: d.endColumn || 120,
      message: d.message,
      source: 'Quantum DSL'
    }));

    monaco.editor.setModelMarkers(model, 'quantum-dsl', markers);
  }, []);

  // Update editor markers whenever diagnostics change
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      setEditorMarkers(monacoRef.current, editorRef.current, diagnostics);
    }
  }, [diagnostics, setEditorMarkers]);

  // When Circuit updates externally (e.g. from visual drag & drop or template load),
  // update the code in the editor unless this update was originated by code typing.
  useEffect(() => {
    if (circuitSource === 'visual') {
      const generated = generateQuantumCode(circuit);
      sourceMapRef.current = {
        gateIdToLine: generated.gateIdToLine,
        lineToGateId: generated.lineToGateId
      };
      isInternalChangeRef.current = true;
      setCode(generated.code);

      if (editorRef.current && editorRef.current.getValue() !== generated.code) {
        editorRef.current.setValue(generated.code);
      }
      setDiagnostics([]);
      if (monacoRef.current && editorRef.current) {
        setEditorMarkers(monacoRef.current, editorRef.current, []);
      }
    }
  }, [circuit, circuitSource, setEditorMarkers]);

  // Visual selection -> highlight line in Monaco
  useEffect(() => {
    if (!selectedGateId || !editorRef.current) return;
    const targetLine = sourceMapRef.current.gateIdToLine.get(selectedGateId);
    if (targetLine !== undefined) {
      editorRef.current.revealLineInCenter(targetLine);
      editorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
    }
  }, [selectedGateId]);

  // Configure theme before mount
  const handleBeforeMount: BeforeMount = (monaco) => {
    defineQuantumTheme(monaco);
  };

  // Setup custom Monaco features on mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    defineQuantumTheme(monaco);
    monaco.editor.setTheme('quantum-lab-theme');

    // Register completion and hover providers only once
    if (!monacoProvidersRegistered) {
      monacoProvidersRegistered = true;

      // Autocomplete provider for Quantum DSL
      monaco.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['.'],
        provideCompletionItems: (model: any, position: any) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          });

          // Check if user is typing after `qc.`
          const match = textUntilPosition.match(/qc\.([a-zA-Z0-9_]*)$/);
          if (!match) {
            // General QuantumCircuit completions
            const items = [
              {
                label: 'QuantumCircuit',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'QuantumCircuit(${1:2})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Initialize a new quantum circuit with N qubits.\nExample: qc = QuantumCircuit(2)'
              }
            ];
            return { suggestions: items };
          }

          const word = match[1];
          const suggestions = Object.entries(QUANTUM_DSL_OPS).map(([opName, meta]) => {
            let insertTextSnippet = '';

            if (opName === 'measure_all') {
              insertTextSnippet = 'measure_all()';
            } else if (opName === 'measure') {
              insertTextSnippet = 'measure(${1:0}, ${2:0})';
            } else if (meta.numQubits === 2) {
              insertTextSnippet = `${opName}(\${1:0}, \${2:1})`;
            } else if (meta.hasParams) {
              insertTextSnippet = `${opName}(\${1:3.14159}, \${2:0})`;
            } else {
              insertTextSnippet = `${opName}(\${1:0})`;
            }

            return {
              label: opName,
              kind: monaco.languages.CompletionItemKind.Method,
              insertText: insertTextSnippet,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: meta.description,
              documentation: {
                value: `**${opName.toUpperCase()} Gate (${meta.type})**\n\n${meta.description}\n\n**Syntax:** \`${meta.signature}\`\n\n**Example:** \`${meta.example}\``
              },
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column - word.length,
                endColumn: position.column
              }
            };
          });

          return { suggestions };
        }
      });

      // Hover provider for Quantum DSL
      monaco.languages.registerHoverProvider('python', {
        provideHover: (model: any, position: any) => {
          const wordInfo = model.getWordAtPosition(position);
          if (!wordInfo) return null;

          const word = wordInfo.word.toLowerCase();
          const opMeta = QUANTUM_DSL_OPS[word];

          if (opMeta) {
            return {
              range: new monaco.Range(
                position.lineNumber,
                wordInfo.startColumn,
                position.lineNumber,
                wordInfo.endColumn
              ),
              contents: [
                { value: `**Quantum Operation: ${opMeta.method.toUpperCase()} (${opMeta.type})**` },
                { value: opMeta.description },
                { value: `\`\`\`python\nSignature: ${opMeta.signature}\nExample:   ${opMeta.example}\n\`\`\`` }
              ]
            };
          }

          if (word === 'quantumcircuit') {
            return {
              range: new monaco.Range(
                position.lineNumber,
                wordInfo.startColumn,
                position.lineNumber,
                wordInfo.endColumn
              ),
              contents: [
                { value: '**QuantumCircuit(num_qubits, num_clbits?)**' },
                { value: 'Initializes a canonical quantum circuit with specified quantum wires and classical readout registers.' }
              ]
            };
          }

          return null;
        }
      });
    }

    // Line cursor tracking for circuit highlighting
    editor.onDidChangeCursorPosition((e) => {
      const line = e.position.lineNumber;
      setHighlightedLineNumber(line);
      const gateId = sourceMapRef.current.lineToGateId.get(line) || null;
      setHighlightedGateId(gateId);
    });

    // Initial markers check
    setEditorMarkers(monaco, editor, diagnostics);
  };

  // Immediate Parse and Apply function
  const applyCodeToCircuit = useCallback(
    (codeToParse: string) => {
      const result = parseQuantumCode(codeToParse);
      setDiagnostics(result.diagnostics);

      if (result.success && result.circuit) {
        // Update local source map
        sourceMapRef.current = {
          lineToGateId: result.lineToGateId,
          gateIdToLine: result.gateIdToLine
        };
        // Commit circuit state with source tag 'code' so we don't clobber the user's typing
        loadCircuit(result.circuit, 'code');
      }
      setIsTyping(false);
    },
    [loadCircuit]
  );

  // Debounced OnChange handler
  const handleEditorChange: OnChange = (value) => {
    const val = value || '';
    setCode(val);

    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    setIsTyping(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      applyCodeToCircuit(val);
    }, 280);
  };

  // Format Code button: regenerates clean standard code from the current circuit
  const handleFormatCode = () => {
    const generated = generateQuantumCode(circuit);
    sourceMapRef.current = {
      gateIdToLine: generated.gateIdToLine,
      lineToGateId: generated.lineToGateId
    };
    setCode(generated.code);
    if (editorRef.current) {
      editorRef.current.setValue(generated.code);
    }
    setDiagnostics([]);
  };

  // Copy Code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const hasErrors = diagnostics.some((d) => d.severity === 'error');

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height,
        minHeight: '440px',
        padding: '1.25rem',
        gap: '0.85rem',
        overflow: 'hidden'
      }}
    >
      {/* Editor Header Toolbar - Cohesive with Quantum Lab Panels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        {/* Left: Title + Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Terminal size={15} style={{ color: 'var(--accent-cyan)' }} />
            <h2
              style={{
                fontSize: '0.95rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-secondary)',
                margin: 0,
                fontWeight: 600
              }}
            >
              Quantum Code Editor
            </h2>
          </div>

          {/* Python DSL Badge */}
          <span
            style={{
              fontSize: '0.7rem',
              padding: '0.18rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            Python DSL
          </span>

          {/* Sync / Diagnostic Status Badge */}
          {hasErrors ? (
            <span
              className="badge"
              style={{
                backgroundColor: 'var(--accent-rose-subtle)',
                color: 'var(--accent-rose)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.7rem',
                padding: '0.18rem 0.55rem'
              }}
              title={diagnostics[0]?.message}
            >
              <AlertCircle size={12} />
              <span>● ERROR ({diagnostics.filter((d) => d.severity === 'error').length})</span>
            </span>
          ) : isTyping ? (
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: 'var(--accent-amber)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.7rem',
                padding: '0.18rem 0.55rem'
              }}
            >
              <RefreshCw size={11} className="animate-spin" />
              <span>● PARSING...</span>
            </span>
          ) : (
            <span
              className="badge"
              style={{
                backgroundColor: 'var(--accent-cyan-subtle)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.7rem',
                padding: '0.18rem 0.55rem',
                boxShadow: '0 0 10px var(--accent-cyan-glow)'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-cyan)',
                  boxShadow: '0 0 6px var(--accent-cyan)'
                }}
              />
              <span>● IN SYNC</span>
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {/* Quick Apply / Update Circuit Button */}
          <button
            type="button"
            onClick={() => applyCodeToCircuit(code)}
            disabled={readOnly}
            className="btn btn-primary"
            title="Parse and apply code to visual circuit immediately"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 10px var(--accent-cyan-glow)'
            }}
          >
            <Play size={12} fill="currentColor" />
            <span>Apply</span>
          </button>

          {/* Format Code */}
          <button
            type="button"
            onClick={handleFormatCode}
            disabled={readOnly}
            className="btn btn-secondary"
            title="Format code from canonical circuit"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <RefreshCw size={12} />
            <span>Format</span>
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="btn btn-secondary"
            title="Copy Python code"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            {copied ? <Check size={12} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Inline Diagnostic Message Banner if Errors exist */}
      {hasErrors && (
        <div
          style={{
            padding: '0.5rem 0.85rem',
            backgroundColor: 'var(--accent-rose-subtle)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--accent-rose)'
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>
            Line {diagnostics[0].line}: {diagnostics[0].message}
          </span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            (Visual circuit holds last valid state)
          </span>
        </div>
      )}

      {/* Editor Surface - Native Quantum Navy Surface matching Workspace Canvas */}
      <div
        className="monaco-quantum-container"
        style={{
          flex: 1,
          minHeight: '380px',
          position: 'relative',
          backgroundColor: '#0a0f1d',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}
      >
        <Editor
          height="100%"
          language="python"
          theme="quantum-lab-theme"
          beforeMount={handleBeforeMount}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            fontSize: 13,
            fontFamily: "var(--font-mono), 'Fira Code', 'JetBrains Mono', Consolas, monospace",
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            lineDecorationsWidth: 8,
            glyphMargin: false,
            minimap: { enabled: false },
            folding: true,
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            tabSize: 4,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            renderLineHighlight: 'all',
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false
            },
            cursorBlinking: 'smooth',
            cursorStyle: 'line',
            cursorWidth: 2,
            smoothScrolling: true,
            contextmenu: true,
            padding: { top: 12, bottom: 12 }
          }}
        />
      </div>
    </div>
  );
};
