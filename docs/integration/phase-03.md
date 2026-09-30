# Phase 3 — Quantum Circuit Builder Integration Guide

**SIH 2026 — AI-Based Interactive Quantum Algorithm Learning Platform (QUANTUMANIA)**  
**Developer Track:** Tanishq (Circuit Builder, Simulator, AI Tutor)  
**Branch:** `feature/phase-03-quantum-circuit-builder`  
**Status:** COMPLETE  

---

## 1. Phase Objective

Phase 3 establishes the interactive visual **Quantum Circuit Builder** and canonical machine-readable circuit representation. The circuit builder provides an intuitive laboratory interface allowing learners to place single-qubit gates ($X, Y, Z, H, S, T$), multi-qubit entangling gates ($CNOT$), and projective measurement operations ($M$) onto multi-wire quantum registers with discrete time slicing ($t_0, t_1, \dots$).

The primary output of Phase 3 is a validated, versioned `CanonicalCircuit` JSON structure conforming strictly to `docs/QUANTUM_SCHEMA.md` that serves as the deterministic input contract for **Phase 4 (Quantum Simulator & Visualizations)**.

---

## 2. Quantum Lab Route

* **Route**: `/app/quantum-lab`
* **Access Control**: Protected within the authenticated application shell (`<ProtectedRoute><AppShell /></ProtectedRoute>`).
* **Deep-Link Template Support**:
  - `/app/quantum-lab?template=bell-state`
  - `/app/quantum-lab?template=superposition`
  - `/app/quantum-lab?template=ghz-state`
  - `/app/quantum-lab?template=empty-2q`
* **Lesson $\to$ Quantum Lab Integration**:
  - Lesson 12 (*Bell States*) and Lesson 18 (*Building Your First Circuit*) contain interactive metadata that routes learners directly to `/app/quantum-lab?template=bell-state`.

---

## 3. Circuit Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Header: Title Input · Templates Dropdown · Undo / Redo · Reset · JSON View · Simulate*│
├───────────────────┬────────────────────────────────────────────────────────────────────┤
│ Gate Palette      │ Circuit Workspace                                                  │
│                   │ Timeline: t0      t1      t2      t3                               │
│ Single-Qubit:     │                                                                    │
│ [ H ] [ X ] [ Y ] │ q0 |0⟩ ───[ H ]───[ ● ]───[ M ]────────────────                   │
│ [ Z ] [ S ] [ T ] │                     │       │                                      │
│                   │ q1 |0⟩ ───────────[ ⊕ ]───[ M ]────────────────                   │
│ Multi-Qubit:      │                                                                    │
│ [ CNOT (CX) ]     │ c / 2b ═════════════════════╧══════════════════                    │
│                   ├────────────────────────────────────────────────────────────────────┤
│ Readout:          │ Circuit Inspector & Live Validation                                │
│ [ Measure (M) ]   │ Selected: CNOT (q0 → q1) · Depth: 3 · ✓ Circuit Valid & Verified   │
└───────────────────┴────────────────────────────────────────────────────────────────────┘
```

The circuit state is cleanly decoupled from React UI components and DOM representations:
```text
Circuit State (CanonicalCircuit)
        │
        ├──▶ Validation Engine (validateCircuit)
        ├──▶ Undo / Redo History Stack (pushState)
        ├──▶ Interactive Grid Renderer (CircuitWorkspace)
        └──▶ Serializer / Simulator Contract (Phase 4 Input)
```

---

## 4. Circuit Data Model & Canonical Contract

Conforms strictly to `docs/QUANTUM_SCHEMA.md` (Schema Version: `1.0.0`):

```typescript
export interface CanonicalCircuit {
  schema_version: '1.0.0';
  id?: string;
  name?: string;
  description?: string;
  qubits: number;          // 1 to 8 (MVP limit)
  classical_bits: number;  // 0 to 10
  gates: QuantumGate[];
  measurements?: MeasurementMapping[];
}

export interface QuantumGate {
  id: string;              // Unique operation ID (e.g. op_7x912a_k91b)
  type: GateType;          // 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'CNOT' | 'MEASURE'
  target?: number;         // 0-indexed target wire
  targets?: number[];      // Array of target indices
  control?: number;        // 0-indexed control wire (for CNOT)
  controls?: number[];     // Array of control indices
  step: number;            // 0-indexed timeline column
  params?: {               // Optional continuous parameters
    theta?: number;
    phi?: number;
    lambda?: number;
  };
}

export interface MeasurementMapping {
  qubit: number;
  classical_bit: number;
}
```

---

## 5. Supported Gates & Registry

All gates are cataloged in `frontend/src/features/circuit/domain/gateRegistry.ts`:

| Gate | Name | Category | Matrix / Action | Requirements | Accessible Label |
|---|---|---|---|---|---|
| `H` | Hadamard | Basic | $\frac{1}{\sqrt{2}}\begin{pmatrix}1 & 1 \\ 1 & -1\end{pmatrix}$ | Single target qubit | Hadamard Gate (Superposition) |
| `X` | Pauli-X | Basic | $\begin{pmatrix}0 & 1 \\ 1 & 0\end{pmatrix}$ (NOT) | Single target qubit | Pauli-X Gate (Bit-flip NOT) |
| `Y` | Pauli-Y | Basic | $\begin{pmatrix}0 & -i \\ i & 0\end{pmatrix}$ | Single target qubit | Pauli-Y Gate (Bit & Phase flip) |
| `Z` | Pauli-Z | Basic | $\begin{pmatrix}1 & 0 \\ 0 & -1\end{pmatrix}$ | Single target qubit | Pauli-Z Gate (Phase-flip) |
| `S` | Phase Gate | Phase | $\begin{pmatrix}1 & 0 \\ 0 & i\end{pmatrix}$ ($\sqrt{Z}$) | Single target qubit | S Phase Gate ($\pi/2$ phase shift) |
| `T` | T Gate | Phase | $\begin{pmatrix}1 & 0 \\ 0 & e^{i\pi/4}\end{pmatrix}$ ($\sqrt[4]{Z}$) | Single target qubit | T Gate ($\pi/4$ phase shift) |
| `CNOT` | Controlled-NOT | Controlled | Controlled bit-flip | Control $c$, Target $t$ ($c \ne t$) | Controlled-NOT Gate (CNOT/CX) |
| `MEASURE`| Measurement | Readout | Projective Born collapse | Target $q \to$ Classical bit $c$ | Measurement Operation |

---

## 6. Validation Rules & Constraint Checks

Enforced identically on the frontend (`circuitDomain.ts`) and backend (`circuit_service.py`):

1. **Qubit Limits**: $1 \le \text{qubits} \le 8$ (configurable up to 10).
2. **Qubit Index Out of Bounds**: Every gate target $t$ and control $c$ must satisfy $0 \le t, c < \text{qubits}$.
3. **Control-Target Distinctness**: For multi-qubit CNOT gates, control and target cannot be identical ($c \ne t$). Violations are rejected with `CONTROL_EQUALS_TARGET`.
4. **Timeline Collision Check**: At any given discrete time step $t_k$, no two gates may act on the same qubit simultaneously. CNOT occupies both its control and target wires at step $t_k$.
5. **Depth & Operations Limits**: $\text{step} < 100$ (`MAX_DEPTH`) and $\text{total gates} \le 500$ (`MAX_OPERATIONS`).
6. **Depth Derivation**:
   $$\text{depth} = \max_{g \in \text{gates}} (g.\text{step} + 1) \quad (\text{or } 0 \text{ if empty})$$

---

## 7. State Management & Undo / Redo

Managed by `CircuitContext.tsx`:
* **History Stack**: Stores up to 30 past immutable snapshots of `CanonicalCircuit`.
* **Future Stack**: Stores redo states.
* **Keyboard Shortcuts**:
  - `Ctrl + Z`: Undo
  - `Ctrl + Y` or `Ctrl + Shift + Z`: Redo
  - `Delete` / `Backspace`: Remove selected gate
  - `Escape`: Deselect gate

---

## 8. Circuit Templates

Pre-configured educational circuits ready for instant loading and deep linking:

1. **`empty-2q`**: 2 unentangled qubits $|00\rangle$.
2. **`superposition`**: Single qubit $H(q_0) \to M(q_0)$.
3. **`bell-state`**: 2 qubits $H(q_0) \to CNOT(q_0, q_1) \to M(q_0), M(q_1)$.
4. **`ghz-state`**: 3 qubits $H(q_0) \to CNOT(q_0, q_1) \to CNOT(q_1, q_2) \to M(q_0, q_1, q_2)$.

---

## 9. API Endpoints

Mounted under `/api/v1/quantum`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/quantum/validate` | Validates a `CanonicalCircuit` against physical rules, returns depth and violation errors |
| `GET` | `/api/v1/quantum/templates` | Retrieves list of standard educational starter templates |
| `GET` | `/api/v1/quantum/templates/{id}`| Retrieves a specific template by ID |

---

## 10. Testing & Verification

1. **Backend Tests** (`backend/tests/test_circuit.py`):
   - 11 dedicated tests covering valid circuits, empty circuits, depth calculation, CNOT control == target errors, qubit out-of-bounds, collisions, and API endpoints.
   - **40 / 40 total backend tests passing (100%)**.
2. **Frontend Domain Tests** (`frontend/scripts/test_circuit_domain.js`):
   - Verified Bell state generation, collision checks, CNOT control/target distinctness, and serialization roundtrips.
3. **Frontend Production Build**:
   - `npm run build` executed cleanly with zero TypeScript errors.

---

## 11. Phase 4 Handoff Contract (For Tanishq)

When Phase 4 commences, the quantum simulation engine simply takes `CanonicalCircuit` as input:

```text
Phase 3 Circuit Builder  ──▶  CanonicalCircuit JSON  ──▶  Phase 4 SimulatorEngine
                                                           ├── Statevector Engine
                                                           ├── Measurement Sampler
                                                           ├── Bloch Sphere Vector
                                                           └── Histogram Renderer
```

### Execution Mapping
* **Qubits**: `circuit.qubits` defines Hilbert space dimension $2^N$.
* **Ordering**: Sort `circuit.gates` by `gate.step ASC`.
* **State Vector Multiplication**: Apply matrix corresponding to `gate.type` to state vector $|\psi\rangle$.
* **Little-Endian Convention**:
  - $q_0$ is the Least Significant Bit (rightmost).
  - $q_{N-1}$ is the Most Significant Bit (leftmost).
  - Wire $0$ is visual top wire, Wire $N-1$ is bottom wire.
* **Measurement**: Projective collapse on target qubits, recording counts into classical bit registers.
