import React, { useState, useMemo } from 'react';
import { Search, X, Layers, ChevronsUpDown, ChevronDown, ChevronRight } from 'lucide-react';

export interface GateDefinition {
  symbol: string;
  name: string;
  displaySymbol?: string;
  category: 'single' | 'rotation' | 'phase' | 'multi' | 'measure' | 'other';
  colorClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
  matrix?: string;
  defaultParam?: string;
  multiQubit?: boolean;
  aliases?: string[];
}

export const GATES_CATALOG: GateDefinition[] = [
  // Single Qubit (BLUE)
  {
    symbol: 'H',
    name: 'Hadamard',
    displaySymbol: 'H',
    category: 'single',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-950/40 hover:bg-blue-900/60 active:bg-blue-800/80',
    borderClass: 'border-blue-500/40 hover:border-blue-400 shadow-sm hover:shadow-blue-950/50',
    description: 'Creates an equal superposition state: H|0⟩ = (|0⟩+|1⟩)/√2.',
    matrix: '1/√2 [[1, 1], [1, -1]]',
    aliases: ['h', 'hadamard', 'superposition']
  },
  {
    symbol: 'X',
    name: 'Pauli-X (NOT)',
    displaySymbol: 'X',
    category: 'single',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-950/40 hover:bg-blue-900/60 active:bg-blue-800/80',
    borderClass: 'border-blue-500/40 hover:border-blue-400 shadow-sm hover:shadow-blue-950/50',
    description: 'Bit-flip gate: X|0⟩ = |1⟩, X|1⟩ = |0⟩.',
    matrix: '[[0, 1], [1, 0]]',
    aliases: ['x', 'pauli-x', 'not', 'bit-flip', 'bitflip']
  },
  {
    symbol: 'Y',
    name: 'Pauli-Y',
    displaySymbol: 'Y',
    category: 'single',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-950/40 hover:bg-blue-900/60 active:bg-blue-800/80',
    borderClass: 'border-blue-500/40 hover:border-blue-400 shadow-sm hover:shadow-blue-950/50',
    description: 'Bit and phase flip: Y|0⟩ = i|1⟩, Y|1⟩ = -i|0⟩.',
    matrix: '[[0, -i], [i, 0]]',
    aliases: ['y', 'pauli-y']
  },
  {
    symbol: 'Z',
    name: 'Pauli-Z',
    displaySymbol: 'Z',
    category: 'single',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-950/40 hover:bg-blue-900/60 active:bg-blue-800/80',
    borderClass: 'border-blue-500/40 hover:border-blue-400 shadow-sm hover:shadow-blue-950/50',
    description: 'Phase flip gate: leaves |0⟩ invariant, flips sign of |1⟩ to -|1⟩.',
    matrix: '[[1, 0], [0, -1]]',
    aliases: ['z', 'pauli-z', 'phase-flip', 'phaseflip']
  },

  // Rotation (PURPLE)
  {
    symbol: 'RX',
    name: 'X-Rotation',
    displaySymbol: 'RX',
    category: 'rotation',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-950/40 hover:bg-purple-900/60 active:bg-purple-800/80',
    borderClass: 'border-purple-500/40 hover:border-purple-400 shadow-sm hover:shadow-purple-950/50',
    description: 'Rotates qubit state vector around Bloch X-axis by angle θ.',
    defaultParam: 'pi/2',
    aliases: ['rx', 'x-rotation', 'rotation x', 'rot-x', 'rotx']
  },
  {
    symbol: 'RY',
    name: 'Y-Rotation',
    displaySymbol: 'RY',
    category: 'rotation',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-950/40 hover:bg-purple-900/60 active:bg-purple-800/80',
    borderClass: 'border-purple-500/40 hover:border-purple-400 shadow-sm hover:shadow-purple-950/50',
    description: 'Rotates qubit state vector around Bloch Y-axis by angle θ.',
    defaultParam: 'pi/2',
    aliases: ['ry', 'y-rotation', 'rotation y', 'rot-y', 'roty']
  },
  {
    symbol: 'RZ',
    name: 'Z-Rotation',
    displaySymbol: 'RZ',
    category: 'rotation',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-950/40 hover:bg-purple-900/60 active:bg-purple-800/80',
    borderClass: 'border-purple-500/40 hover:border-purple-400 shadow-sm hover:shadow-purple-950/50',
    description: 'Rotates qubit state vector around Bloch Z-axis by angle θ.',
    defaultParam: 'pi/2',
    aliases: ['rz', 'z-rotation', 'rotation z', 'rot-z', 'rotz']
  },

  // Phase (TEAL)
  {
    symbol: 'S',
    name: 'Phase (S)',
    displaySymbol: 'S',
    category: 'phase',
    colorClass: 'text-teal-400',
    bgClass: 'bg-teal-950/40 hover:bg-teal-900/60 active:bg-teal-800/80',
    borderClass: 'border-teal-500/40 hover:border-teal-400 shadow-sm hover:shadow-teal-950/50',
    description: 'Quarter-turn phase shift: S|1⟩ = i|1⟩. Equivalent to √Z.',
    matrix: '[[1, 0], [0, i]]',
    aliases: ['s', 'phase', 'phase (s)', 'sqrt(z)']
  },
  {
    symbol: 'T',
    name: 'T Gate (π/8)',
    displaySymbol: 'T',
    category: 'phase',
    colorClass: 'text-teal-400',
    bgClass: 'bg-teal-950/40 hover:bg-teal-900/60 active:bg-teal-800/80',
    borderClass: 'border-teal-500/40 hover:border-teal-400 shadow-sm hover:shadow-teal-950/50',
    description: 'Eighth-turn phase gate: T|1⟩ = e^(iπ/4)|1⟩. Key for universal fault-tolerance.',
    matrix: '[[1, 0], [0, e^(iπ/4)]]',
    aliases: ['t', 't gate', 'pi/8', 't-gate']
  },
  {
    symbol: 'SDG',
    name: 'S-Dagger',
    displaySymbol: 'S†',
    category: 'phase',
    colorClass: 'text-teal-400',
    bgClass: 'bg-teal-950/40 hover:bg-teal-900/60 active:bg-teal-800/80',
    borderClass: 'border-teal-500/40 hover:border-teal-400 shadow-sm hover:shadow-teal-950/50',
    description: 'Inverse Phase gate: SDG|1⟩ = -i|1⟩.',
    matrix: '[[1, 0], [0, -i]]',
    aliases: ['sdg', 's-dagger', 's†', 'sdag', 'sinv', 's dagger']
  },
  {
    symbol: 'TDG',
    name: 'T-Dagger',
    displaySymbol: 'T†',
    category: 'phase',
    colorClass: 'text-teal-400',
    bgClass: 'bg-teal-950/40 hover:bg-teal-900/60 active:bg-teal-800/80',
    borderClass: 'border-teal-500/40 hover:border-teal-400 shadow-sm hover:shadow-teal-950/50',
    description: 'Inverse T gate: TDG|1⟩ = e^(-iπ/4)|1⟩.',
    matrix: '[[1, 0], [0, e^(-iπ/4)]]',
    aliases: ['tdg', 't-dagger', 't†', 'tdag', 'tinv', 't dagger']
  },

  // Multi-Qubit (AMBER)
  {
    symbol: 'CX',
    name: 'CNOT (CX)',
    displaySymbol: 'CX',
    category: 'multi',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-950/40 hover:bg-amber-900/60 active:bg-amber-800/80',
    borderClass: 'border-amber-500/40 hover:border-amber-400 shadow-sm hover:shadow-amber-950/50',
    description: 'Controlled-NOT: flips target qubit if control qubit is |1⟩. Core entangler.',
    multiQubit: true,
    aliases: ['cx', 'cnot', 'controlled-not', 'controlled not', 'cx-gate']
  },
  {
    symbol: 'CZ',
    name: 'Controlled-Z',
    displaySymbol: 'CZ',
    category: 'multi',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-950/40 hover:bg-amber-900/60 active:bg-amber-800/80',
    borderClass: 'border-amber-500/40 hover:border-amber-400 shadow-sm hover:shadow-amber-950/50',
    description: 'Controlled phase flip: applies -1 phase only when both qubits are |11⟩.',
    multiQubit: true,
    aliases: ['cz', 'controlled-z', 'controlled z', 'cz-gate']
  },
  {
    symbol: 'SWAP',
    name: 'SWAP',
    displaySymbol: 'SWAP',
    category: 'multi',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-950/40 hover:bg-amber-900/60 active:bg-amber-800/80',
    borderClass: 'border-amber-500/40 hover:border-amber-400 shadow-sm hover:shadow-amber-950/50',
    description: 'Exchanges the quantum states of two qubits: SWAP|01⟩ = |10⟩.',
    multiQubit: true,
    aliases: ['swap', 'exchange']
  },
  {
    symbol: 'CCX',
    name: 'Toffoli (CCX)',
    displaySymbol: 'CCX',
    category: 'multi',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-950/40 hover:bg-amber-900/60 active:bg-amber-800/80',
    borderClass: 'border-amber-500/40 hover:border-amber-400 shadow-sm hover:shadow-amber-950/50',
    description: 'Controlled-Controlled-NOT: universal classical and quantum reversible gate.',
    multiQubit: true,
    aliases: ['ccx', 'toffoli', 'c-cnot', 'controlled-controlled-not', 'ccnot']
  },

  // Measurement & Reset (PINK)
  {
    symbol: 'MEASURE',
    name: 'Measure',
    displaySymbol: 'Measure',
    category: 'measure',
    colorClass: 'text-pink-400',
    bgClass: 'bg-pink-950/40 hover:bg-pink-900/60 active:bg-pink-800/80',
    borderClass: 'border-pink-500/40 hover:border-pink-400 shadow-sm hover:shadow-pink-950/50',
    description: 'Collapses qubit state to |0⟩ or |1⟩ and writes result to classical bit.',
    aliases: ['measure', 'measurement', 'meas', 'm']
  },
  {
    symbol: 'RESET',
    name: 'Reset |0⟩',
    displaySymbol: 'Reset',
    category: 'measure',
    colorClass: 'text-pink-400',
    bgClass: 'bg-pink-950/40 hover:bg-pink-900/60 active:bg-pink-800/80',
    borderClass: 'border-pink-500/40 hover:border-pink-400 shadow-sm hover:shadow-pink-950/50',
    description: 'Non-unitary operation that resets the target qubit back to ground state |0⟩.',
    aliases: ['reset', 'reset |0⟩', 'prepare-0', 'ground state']
  },

  // Other (SLATE)
  {
    symbol: 'BARRIER',
    name: 'Barrier',
    displaySymbol: 'Barrier',
    category: 'other',
    colorClass: 'text-slate-400',
    bgClass: 'bg-slate-900/50 hover:bg-slate-800/70 active:bg-slate-700/80',
    borderClass: 'border-slate-700/50 hover:border-slate-500 shadow-sm hover:shadow-slate-950/50',
    description: 'Visual demarcation and optimization barrier preventing compiler gate reordering.',
    aliases: ['barrier', 'demarcation', 'bar']
  },
  {
    symbol: 'CUSTOM',
    name: 'Custom Gate',
    displaySymbol: 'Custom',
    category: 'other',
    colorClass: 'text-slate-400',
    bgClass: 'bg-slate-900/50 hover:bg-slate-800/70 active:bg-slate-700/80',
    borderClass: 'border-slate-700/50 hover:border-slate-500 shadow-sm hover:shadow-slate-950/50',
    description: 'Arbitrary unitary matrix or user-defined subcircuit gate.',
    aliases: ['custom', 'unitary', 'custom gate', 'u']
  }
];

const CATEGORIES_CONFIG: {
  id: GateDefinition['category'];
  title: string;
  badgeClass: string;
  gridColsClass: string;
  isWide?: boolean;
}[] = [
  {
    id: 'single',
    title: 'Single Qubit Gates',
    badgeClass: 'text-blue-400 bg-blue-950/60 border-blue-800/50',
    gridColsClass: 'grid-cols-4'
  },
  {
    id: 'rotation',
    title: 'Rotation Gates',
    badgeClass: 'text-purple-400 bg-purple-950/60 border-purple-800/50',
    gridColsClass: 'grid-cols-3'
  },
  {
    id: 'phase',
    title: 'Phase Gates',
    badgeClass: 'text-teal-400 bg-teal-950/60 border-teal-800/50',
    gridColsClass: 'grid-cols-4'
  },
  {
    id: 'multi',
    title: 'Multi-Qubit Gates',
    badgeClass: 'text-amber-400 bg-amber-950/60 border-amber-800/50',
    gridColsClass: 'grid-cols-4'
  },
  {
    id: 'measure',
    title: 'Measurement & Reset',
    badgeClass: 'text-pink-400 bg-pink-950/60 border-pink-800/50',
    gridColsClass: 'grid-cols-2',
    isWide: true
  },
  {
    id: 'other',
    title: 'Other',
    badgeClass: 'text-slate-400 bg-slate-900/60 border-slate-700/50',
    gridColsClass: 'grid-cols-2',
    isWide: true
  }
];

interface GateToolboxProps {
  onSelectGate: (gate: GateDefinition) => void;
  activeGateSymbol?: string | null;
}

export const GateToolbox: React.FC<GateToolboxProps> = ({ onSelectGate, activeGateSymbol }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    single: false,
    rotation: false,
    phase: false,
    multi: false,
    measure: false,
    other: false
  });

  const toggleCategory = (catId: string) => {
    setCollapsed((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleAll = () => {
    const anyOpen = Object.values(collapsed).some((val) => !val);
    const updated: Record<string, boolean> = {};
    CATEGORIES_CONFIG.forEach((c) => {
      updated[c.id] = anyOpen;
    });
    setCollapsed(updated);
  };

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Filter gates based on search query
  const filteredGates = useMemo(() => {
    if (!searchQuery.trim()) return GATES_CATALOG;
    const q = searchQuery.trim().toLowerCase();
    const qNorm = normalize(searchQuery);

    return GATES_CATALOG.filter((g) => {
      if (g.symbol.toLowerCase().includes(q)) return true;
      if (g.name.toLowerCase().includes(q)) return true;
      if (g.category.toLowerCase().includes(q)) return true;
      if (g.description.toLowerCase().includes(q)) return true;
      if (g.displaySymbol && g.displaySymbol.toLowerCase().includes(q)) return true;
      if (normalize(g.name).includes(qNorm)) return true;
      if (normalize(g.symbol).includes(qNorm)) return true;
      if (g.aliases && g.aliases.some((a) => a.toLowerCase().includes(q) || normalize(a).includes(qNorm))) {
        return true;
      }
      return false;
    });
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  // Render individual compact square gate button
  const renderGateButton = (gate: GateDefinition, isWide: boolean = false) => {
    const isSelected = activeGateSymbol?.toUpperCase() === gate.symbol.toUpperCase();
    const titleText = `${gate.name} (${gate.symbol})\n${gate.description}${
      gate.defaultParam ? `\nParameter θ = ${gate.defaultParam}` : ''
    }`;

    // Styling properties for consistent rendering
    const categoryBorderColor = 
      gate.category === 'single' ? '#3b82f6' :
      gate.category === 'rotation' ? '#a855f7' :
      gate.category === 'phase' ? '#14b8a6' :
      gate.category === 'multi' ? '#f59e0b' :
      gate.category === 'measure' ? '#ec4899' : '#64748b';

    const categoryBgColor =
      gate.category === 'single' ? 'rgba(30, 58, 138, 0.4)' :
      gate.category === 'rotation' ? 'rgba(88, 28, 135, 0.4)' :
      gate.category === 'phase' ? 'rgba(19, 78, 74, 0.4)' :
      gate.category === 'multi' ? 'rgba(120, 53, 15, 0.4)' :
      gate.category === 'measure' ? 'rgba(131, 24, 67, 0.4)' : 'rgba(30, 41, 59, 0.5)';

    const textColor =
      gate.category === 'single' ? '#60a5fa' :
      gate.category === 'rotation' ? '#c084fc' :
      gate.category === 'phase' ? '#2dd4bf' :
      gate.category === 'multi' ? '#fbbf24' :
      gate.category === 'measure' ? '#f472b6' : '#94a3b8';

    return (
      <button
        key={gate.symbol}
        type="button"
        role="button"
        tabIndex={0}
        aria-label={`${gate.name} gate: ${gate.description}`}
        title={titleText}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/json', JSON.stringify(gate));
          e.dataTransfer.setData('application/quantum-gate', gate.symbol);
          e.dataTransfer.effectAllowed = 'copy';
        }}
        onClick={() => onSelectGate(gate)}
        style={{
          height: isWide ? '32px' : '44px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.25)' : categoryBgColor,
          border: isSelected ? '2px solid #00F2FE' : `1px solid ${categoryBorderColor}66`,
          boxShadow: isSelected ? '0 0 12px rgba(0, 242, 254, 0.4)' : '0 1px 3px rgba(0,0,0,0.3)',
          cursor: 'grab',
          transition: 'all 0.15s ease',
          userSelect: 'none'
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 'bold',
            fontSize: isWide ? '11px' : gate.symbol.length > 3 ? '11px' : '13px',
            color: textColor,
            letterSpacing: '-0.02em'
          }}
        >
          {gate.displaySymbol || gate.symbol}
        </span>
      </button>
    );
  };

  return (
    <aside
      className="ql-scrollbar"
      style={{
        width: '260px',
        backgroundColor: '#0a0f1d',
        border: '1px solid rgba(8, 51, 68, 0.7)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '480px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        flexShrink: 0
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '8px',
          marginBottom: '8px',
          borderBottom: '1px solid #1e293b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="#00F2FE" />
          <h3
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#e2e8f0',
              margin: 0
            }}
          >
            Gate Palette
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={toggleAll}
            style={{
              padding: '4px',
              borderRadius: '4px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Toggle Expand / Collapse All"
          >
            <ChevronsUpDown size={12} />
          </button>
          <span
            style={{
              fontSize: '10px',
              color: '#64748b',
              fontFamily: 'var(--font-mono, monospace)'
            }}
          >
            {filteredGates.length}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <Search
          size={14}
          color="#64748b"
          style={{ position: 'absolute', left: '10px', top: '9px', pointerEvents: 'none' }}
        />
        <input
          type="text"
          placeholder="Search gates (e.g. H, CNOT, Rx)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '32px',
            paddingRight: '28px',
            paddingTop: '6px',
            paddingBottom: '6px',
            backgroundColor: '#080c18',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#e2e8f0',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '8px',
              top: '6px',
              color: '#64748b',
              cursor: 'pointer',
              padding: '2px'
            }}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Gate Categories Area */}
      <div
        className="ql-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '2px'
        }}
      >
        {isSearching ? (
          <div>
            <div
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#64748b',
                marginBottom: '6px',
                paddingLeft: '2px'
              }}
            >
              Found {filteredGates.length} matching gates:
            </div>
            {filteredGates.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 0',
                  color: '#64748b',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)'
                }}
              >
                No gates match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: '6px'
                }}
              >
                {filteredGates.map((gate) => renderGateButton(gate))}
              </div>
            )}
          </div>
        ) : (
          CATEGORIES_CONFIG.map((cat) => {
            const gatesInCat = GATES_CATALOG.filter((g) => g.category === cat.id);
            const isCollapsed = collapsed[cat.id];
            const cols = cat.gridColsClass === 'grid-cols-4' ? 4 : cat.gridColsClass === 'grid-cols-3' ? 3 : 2;

            return (
              <div
                key={cat.id}
                style={{
                  border: '1px solid rgba(30, 41, 59, 0.6)',
                  borderRadius: '8px',
                  backgroundColor: '#080c18',
                  overflow: 'hidden'
                }}
              >
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    cursor: 'pointer',
                    borderBottom: isCollapsed ? 'none' : '1px solid #1e293b'
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#94a3b8'
                    }}
                  >
                    {cat.title}
                  </span>
                  {isCollapsed ? <ChevronRight size={12} color="#64748b" /> : <ChevronDown size={12} color="#64748b" />}
                </button>

                {/* Gates Grid */}
                {!isCollapsed && (
                  <div
                    style={{
                      padding: '8px',
                      display: 'grid',
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      gap: '6px'
                    }}
                  >
                    {gatesInCat.map((gate) => renderGateButton(gate, cat.isWide))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
