# Quantum Lab: Drag & Drop Circuit Designer + Bidirectional Monaco Code Editor

## 1. Overview & Architecture

The **Quantum Lab** integrates a professional visual quantum circuit designer with a real Monaco-based code editor, synchronized through a single canonical circuit representation (`CanonicalCircuit`).

```text
                           CANONICAL CIRCUIT MODEL
                           (Schema Version: 1.0.0)
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      VISUAL CIRCUIT DESIGNER                    MONACO CODE EDITOR
   (HTML5 Drag & Drop Palette)                  (Python Quantum DSL)
                 │                                         │
          Visual Actions                             Code Parsing
        (place, move, drop)                       (280ms debounce)
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      │
                                SYNCHRONIZED
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
         QUANTUM SIMULATOR                         AI QUANTUM TUTOR
     (Classical State-Vector)                 (Full Context Awareness)
```

Both interfaces operate as equal peers on the canonical circuit state. Edits in the visual builder immediately regenerate deterministic, human-readable Python code, while code typed in the Monaco editor is parsed and scheduled into the visual canvas without destroying active simulator results or AI tutor conversations.

---

## 2. Canonical Circuit Domain Model

The platform strictly uses the unified `CanonicalCircuit` schema:

```typescript
export interface CanonicalCircuit {
  schema_version: '1.0.0';
  id?: string;
  name?: string;
  description?: string;
  qubits: number;            // 1 to 5 qubits supported
  classical_bits: number;    // Classical readout bits
  gates: QuantumGate[];      // List of operations with step column & wire coordinates
  measurements?: MeasurementMapping[];
}

export interface QuantumGate {
  id: string;
  type: GateType;            // 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'CNOT' | 'CZ' | 'SWAP' | 'RX' | 'RY' | 'RZ' | 'MEASURE'
  target?: number;
  targets?: number[];
  control?: number;
  controls?: number[];
  step: number;              // 0-indexed column moment
  params?: {
    theta?: number;
    phi?: number;
    lambda?: number;
  };
}
```

---

## 3. Quantum DSL Syntax Specification

The editor uses an educational, standard Qiskit-compatible Python syntax:

### Circuit Initialization
```python
# Create circuit with N qubits (and optional M classical bits)
qc = QuantumCircuit(2)
# Or with explicit classical bits:
qc = QuantumCircuit(2, 2)
```

### Supported Quantum Operations
| Operation | Python DSL Syntax | Qubits | Description |
|-----------|-------------------|--------|-------------|
| **Hadamard** | `qc.h(0)` | 1 | Equal superposition creation |
| **Pauli-X (NOT)** | `qc.x(0)` | 1 | Bit-flip operation |
| **Pauli-Y** | `qc.y(0)` | 1 | Bit- and phase-flip operation |
| **Pauli-Z** | `qc.z(0)` | 1 | Phase-flip operation |
| **Phase (S)** | `qc.s(0)` | 1 | $\pi/2$ phase rotation around Z ($\sqrt{Z}$) |
| **$\pi/8$ (T)** | `qc.t(0)` | 1 | $\pi/4$ phase rotation around Z ($\sqrt{S}$) |
| **Controlled-NOT** | `qc.cx(0, 1)` or `qc.cnot(0, 1)` | 2 | Entanglement & conditional flip |
| **Controlled-Z** | `qc.cz(0, 1)` | 2 | Conditional phase inversion |
| **SWAP** | `qc.swap(0, 1)` | 2 | Exchanges quantum states between 2 wires |
| **Rotation-X** | `qc.rx(3.14159, 0)` | 1 | Rotation around X-axis by $\theta$ |
| **Rotation-Y** | `qc.ry(1.5708, 0)` | 1 | Rotation around Y-axis by $\theta$ |
| **Rotation-Z** | `qc.rz(0.7854, 0)` | 1 | Rotation around Z-axis by $\theta$ |
| **Measurement** | `qc.measure(0, 0)` | 1 | Readout qubit into classical register |
| **Measure All** | `qc.measure_all()` | All | Readout all qubits into corresponding registers |

---

## 4. Bidirectional Synchronization Engine

The sync engine coordinates changes between visual interactions and text typing with strict loop prevention.

### Direction A: Visual $\to$ Code
1. User interacts with visual builder (drags a gate from palette, moves an existing gate, or deletes a gate).
2. `CircuitContext` updates canonical circuit with `source = 'visual'`.
3. `generateQuantumCode(circuit)` compiles deterministic Python code:
   - Header with `QuantumCircuit(n)`.
   - Chronologically scheduled unitary gates sorted by step.
   - Measurement operations.
   - Generates bidirectional source maps (`lineToGateId` and `gateIdToLine`).
4. Monaco editor text updates programmatically; internal change flag suppresses trigger loops.

### Direction B: Code $\to$ Visual
1. User types in Monaco editor.
2. Keystrokes are debounced (280ms) to ensure smooth typing responsiveness.
3. `parseQuantumCode(text)` tokenizes, extracts parameters, validates qubit ranges, and schedules moments using greedy left-aligned allocation.
4. **Validation Check:**
   - **Valid Code:** Updates canonical circuit with `source = 'code'`. Visual canvas reflects the circuit without re-rendering the editor's text buffer.
   - **Invalid Code:** Safe state preservation. Diagnostics are published as Monaco inline error markers and visual toast alerts. The visual canvas remains locked on the last valid circuit state until typing errors are resolved.

### Bidirectional Highlight Sync
- Clicking a gate on the visual canvas moves Monaco's cursor to the corresponding line.
- Placing the cursor or navigating lines in Monaco highlights the corresponding gate in the visual circuit with a glowing cyan halo.

---

## 5. Security & Safety

- **Zero Unsafe Code Execution:** The code editor uses a dedicated, controlled quantum tokenizer and parser (`codeParser.ts`).
- It **never** invokes `eval()`, `exec()`, or executes arbitrary Python/JavaScript code.
- Out-of-bounds qubit indexes, duplicate control-target pairs, and unknown functions produce safe error markers without affecting runtime security.

---

## 6. Multi-View Responsive Layout

The workspace supports three viewing modes via the toolbar:
1. **Split View (`Split`):** Side-by-side Gate Palette, Interactive Circuit Canvas, and Monaco Code Editor. Inspector is cleanly nested beneath palette.
2. **Canvas Only (`Canvas`):** Dedicated visual designer layout with Palette, Canvas, and Inspector.
3. **Code Only (`Code`):** Focused full-width Monaco editor with reference gate palette.

On screens below 1280px, columns automatically adapt and wrap, ensuring full functionality on laptops, tablets, and mobile devices.

---

## 7. Learner User Guide

```text
Step 1: Open the Quantum Lab from the application sidebar (/app/quantum-lab).
Step 2: Drag a gate (e.g. Hadamard) from the Gate Palette and drop it onto qubit 0 (q0).
Step 3: Observe the Monaco editor immediately update with:
        qc = QuantumCircuit(2)
        qc.h(0)
Step 4: Click into the Monaco editor and add:
        qc.cx(0, 1)
Step 5: Watch the visual canvas automatically link q0 and q1 with a CNOT entangling gate!
Step 6: Click "Run Circuit" in the header to execute the quantum state-vector simulation.
Step 7: Click "AI Tutor" to analyze the circuit and ask questions like:
        "Why does this circuit create an entangled Bell state?"
```

---

## 8. Verification & Test Suite

The implementation is verified with unit and integration tests:
- `npx tsx src/features/circuit/domain/__tests__/runTests.ts`:
  - Test 1: Bell state round-trip conversion.
  - Test 2: Code $\to$ Circuit $\to$ Code round-trip.
  - Test 3: Diagnostics on invalid syntax, out-of-range qubits, unknown operations, and identical CNOT control/target.
  - Test 4: All 4 starter templates (Superposition, Bell State, GHZ State, Teleportation) round-trip verification.
  - Test 5: Drag & drop gate movement (`moveGate`) with code generation synchronization.
  - Test 6: Parameterized gates (`RX`, `RY`, `RZ`) with angle parameter parsing.
  - Test 7: Convenience method `qc.measure_all()` parsing.
- Frontend TypeScript typecheck (`npm run typecheck`): 0 errors.
- Frontend production bundle build (`npm run build`): Completed in 1.45s.
- Backend regression test suite (`pytest backend/tests/ -v`): 73/73 passed.
