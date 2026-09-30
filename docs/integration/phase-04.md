# Phase 4 Integration Document — Classical Quantum Simulator

**SIH 2026 — AI-Based Interactive Quantum Algorithm Learning Platform**  
**Repository:** `QUANTUMANIA`  
**Track:** Tanishq (Phase 3: Circuit Builder $\to$ Phase 4: Quantum Simulator $\to$ Phase 5: AI Tutor)  
**Schema Parity:** `docs/QUANTUM_SCHEMA.md` (Schema Version: `1.0.0`)  
**Status:** Complete & Integrated into `feature/phase-04-quantum-simulator`

---

## 1. Phase Objective

Phase 4 makes the canonical quantum circuits constructed in Phase 3 fully **executable** using a high-performance, deterministic classical quantum state-vector simulation engine.

The platform pipeline is:
```text
  Phase 3                          Phase 4                          Phase 4 / Phase 5
Quantum Circuit Builder  ──►  Quantum Simulator Engine  ──►  Results Visualizer & AI Tutor
 (CanonicalCircuit)            (Statevector evolution)       (Histograms, Statevector, Bloch)
```

The simulator computes exact state-vector transformations in $\mathbb{C}^{2^N}$, theoretical basis-state probabilities, empirical multi-shot measurement distributions, reduced single-qubit Bloch coordinates, and verified pedagogical insights.

---

## 2. Simulator Architecture

The simulation engine is implemented as a pure, modular mathematical domain library completely independent of React or DOM dependencies. It can be invoked directly in the browser for instant sub-millisecond feedback or on the backend via FastAPI (`POST /api/v1/quantum/simulate`).

```text
frontend/src/features/circuit/simulator/
├── complex.ts                  # Pure complex arithmetic (add, mul, conj, magSq, phase)
├── stateVector.ts              # 2^N statevector allocation, indexing, normalization, Bloch vectors
├── gates.ts                    # 2x2 unitary matrices, generic single-qubit & 2-qubit gates
├── measurement.ts              # Probabilistic sampling via CDF binary search across shots
├── educationalExplanations.ts  # Deterministic pedagogical insights (Bell state, GHZ, interference)
├── quantumSimulator.ts         # Simulation orchestrator (simulateCircuit)
└── index.ts                    # Public domain exports
```

Backend mirror service:
```text
backend/app/
├── schemas/simulation.py       # Pydantic schemas strictly matching docs/QUANTUM_SCHEMA.md Section 8
└── services/simulation_service.py # Exact mathematical mirror in Python 3 for grading and test parity
```

---

## 3. Quantum State Representation

For an $N$-qubit quantum register, the state $|\psi\rangle$ lives in a $2^N$-dimensional Hilbert space:
$$|\psi\rangle = \sum_{k=0}^{2^N - 1} \alpha_k |k\rangle, \quad \alpha_k \in \mathbb{C}$$

- **1 Qubit ($N=1$):** Basis $\{|0\rangle, |1\rangle\}$, dimension = 2.
- **2 Qubits ($N=2$):** Basis $\{|00\rangle, |01\rangle, |10\rangle, |11\rangle\}$, dimension = 4.
- **3 Qubits ($N=3$):** Basis $\{|000\rangle, \dots, |111\rangle\}$, dimension = 8.
- **$N$ Qubits:** Dimension $= 2^N$ complex numbers.

Every simulation begins deterministically in the all-zero ground state:
$$|\psi_{\text{init}}\rangle = |00\dots0\rangle = [1 + 0i, 0 + 0i, \dots, 0 + 0i]^T$$

---

## 4. Complex Number Representation

Complex numbers are represented as immutable numeric structures:
```typescript
export interface Complex {
  real: number;
  imaginary: number;
}
```

Core arithmetic operations implemented in `complex.ts`:
- **Addition:** $(a + bi) + (c + di) = (a + c) + (b + d)i$
- **Subtraction:** $(a + bi) - (c + di) = (a - c) + (b - d)i$
- **Multiplication:** $(a + bi)(c + di) = (ac - bd) + (ad + bc)i$
- **Complex Conjugate:** $(a + bi)^* = a - bi$
- **Squared Magnitude:** $|a + bi|^2 = a^2 + b^2$
- **Phase Angle:** $\theta = \operatorname{atan2}(b, a) \in [-\pi, \pi]$

---

## 5. Qubit Indexing Convention (Endianness)

QUANTUMANIA strictly adheres to the standard **Qiskit Little-Endian convention** specified in `docs/QUANTUM_SCHEMA.md` Section 4:
- Basis bitstrings are written as $|q_{n-1} \dots q_1 q_0\rangle$.
- **Qubit 0 ($q_0$)** is the **least significant bit (LSB / rightmost bit)**.
- **Qubit $n-1$ ($q_{n-1}$)** is the **most significant bit (MSB / leftmost bit)**.

### Bit Mapping Table (2-Qubit System):
| Index $k$ | Binary $q_1 q_0$ | $q_0$ state | $q_1$ state | Basis Ket |
|---|---|---|---|---|
| 0 | `00` | 0 | 0 | $|00\rangle$ |
| 1 | `01` | 1 | 0 | $|01\rangle$ |
| 2 | `10` | 0 | 1 | $|10\rangle$ |
| 3 | `11` | 1 | 1 | $|11\rangle$ |

---

## 6. Supported Gates & Unitary Matrices

The simulator implements all Phase 3 gates with exact complex unitary matrices:

| Gate | Name | Matrix $U$ | Mathematical Action |
|---|---|---|---|
| **X** | Pauli-X (NOT) | $\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$ | $X\|0\rangle = \|1\rangle, \quad X\|1\rangle = \|0\rangle$ |
| **Y** | Pauli-Y | $\begin{pmatrix} 0 & -i \\ i & 0 \end{pmatrix}$ | $Y\|0\rangle = i\|1\rangle, \quad Y\|1\rangle = -i\|0\rangle$ |
| **Z** | Pauli-Z | $\begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}$ | $Z\|0\rangle = \|0\rangle, \quad Z\|1\rangle = -\|1\rangle$ |
| **H** | Hadamard | $\frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$ | $H\|0\rangle = \frac{\|0\rangle + \|1\rangle}{\sqrt{2}}, \quad H\|1\rangle = \frac{\|0\rangle - \|1\rangle}{\sqrt{2}}$ |
| **S** | Phase ($\pi/2$) | $\begin{pmatrix} 1 & 0 \\ 0 & i \end{pmatrix}$ | $S\|0\rangle = \|0\rangle, \quad S\|1\rangle = i\|1\rangle$ |
| **T** | $\pi/8$ Gate | $\begin{pmatrix} 1 & 0 \\ 0 & e^{i\pi/4} \end{pmatrix}$ | $T\|0\rangle = \|0\rangle, \quad T\|1\rangle = \left(\frac{1+i}{\sqrt{2}}\right)\|1\rangle$ |
| **CNOT** | Controlled-NOT | 4x4 Controlled | Flips target qubit if and only if control qubit is 1 |
| **CZ** | Controlled-Z | 4x4 Controlled | Inverts phase if and only if both control and target are 1 |
| **SWAP**| Swap | 4x4 Unitary | Exchanges the state amplitudes of two qubits |
| **MEASURE**| Measurement | Projective | Collapses onto computational basis during sampling |

---

## 7. Single-Qubit & Multi-Qubit Gate Execution

### Generic Single-Qubit Application
Instead of hardcoding gate loops, `applySingleQubitGate` uses a generic bitwise stride algorithm:
```typescript
function applySingleQubitGate(state: Complex[], matrix: GateMatrix2x2, targetQubit: number, numQubits: number): Complex[]
```
For any basis state $k$ with target bit 0 ($k \text{ AND } 2^t = 0$) and paired state $k \text{ OR } 2^t$:
$$\begin{pmatrix} \alpha_{\text{new}, 0} \\ \alpha_{\text{new}, 1} \end{pmatrix} = \begin{pmatrix} m_{00} & m_{01} \\ m_{10} & m_{11} \end{pmatrix} \begin{pmatrix} \alpha_0 \\ \alpha_1 \end{pmatrix}$$

### CNOT Execution
`applyCNOT(state, controlQubit, targetQubit, numQubits)` inspects bit $c$ using mask $2^c$:
- If bit $c = 1$, the amplitude is paired with basis state $k \oplus 2^t$.
- If bit $c = 0$, the amplitude is unaltered.

---

## 8. Measurement Model & Multi-Shot Sampling

1. **Theoretical Probabilities:**
   For basis state $|k\rangle$:
   $$P(k) = |\alpha_k|^2 = \operatorname{Re}(\alpha_k)^2 + \operatorname{Im}(\alpha_k)^2$$
2. **Normalization Validation:**
   Enforces $\sum_{k=0}^{2^N - 1} P(k) = 1.0 \pm 10^{-6}$.
3. **Multi-Shot Sampling:**
   Constructs a Cumulative Distribution Function (CDF) over all basis states:
   $$C_j = \sum_{i=0}^j P(i), \quad C_{2^N - 1} = 1.0$$
   For each shot $s \in [1, \text{shots}]$, samples a uniform pseudo-random number $r \in [0, 1)$ and performs a binary search over $C$ in $O(\log(2^N)) = O(N)$ time.
4. **Deterministic Testing:**
   `sampleMeasurements` accepts an optional custom RNG parameter `rng?: () => number` allowing unit tests to inject deterministic sequences.

---

## 9. Simulation Result Contract

Conforms strictly to `docs/QUANTUM_SCHEMA.md` Section 8:
```json
{
  "success": true,
  "shots": 1024,
  "counts": {
    "00": 516,
    "11": 508
  },
  "probabilities": {
    "00": 0.5,
    "01": 0.0,
    "10": 0.0,
    "11": 0.5
  },
  "statevector": [
    {
      "basis": "00",
      "real": 0.707107,
      "imag": 0.0,
      "magnitude": 0.5,
      "phase_rad": 0.0
    },
    {
      "basis": "11",
      "real": 0.707107,
      "imag": 0.0,
      "magnitude": 0.5,
      "phase_rad": 0.0
    }
  ],
  "bloch_vectors": [
    { "qubit": 0, "x": 0.0, "y": 0.0, "z": 0.0 },
    { "qubit": 1, "x": 0.0, "y": 0.0, "z": 0.0 }
  ],
  "execution_time_ms": 2.15,
  "explanation": "Maximally Entangled Bell State |Φ+⟩: The circuit creates correlated two-qubit outcomes..."
}
```

---

## 10. Educational Pedagogical Insights

Deterministic insight generator (`educationalExplanations.ts`) identifies key quantum phenomena without relying on external non-deterministic AI models:
- **Bell State $|\Phi^+\rangle$:** Detects 2-qubit entanglement when $H(q_0)$ is followed by $CNOT(q_0, q_1)$.
- **GHZ Tripartite Entanglement:** Detects 3-qubit state $(|000\rangle + |111\rangle)/\sqrt{2}$.
- **H-H Phase Cancellation:** Explains destructive interference $H^2 = I$ returning deterministically to $|0\rangle$.
- **Equal Superposition:** Explains $H|0\rangle = (|0\rangle + |1\rangle)/\sqrt{2}$ and wave function collapse.
- **Pauli-X Bit Flip:** Explains quantum NOT gate and basis state inversion.

---

## 11. UI Integration in Quantum Lab

1. **Toolbar Controls:**
   - **Shots Selector:** Configurable dropdown ($10, 100, 1000, 1024, 4096$).
   - **Run Circuit:** Active primary button with dynamic loading spinner during state evolution.
2. **Results Panel (`SimulationResultsPanel.tsx`):**
   - **Execution Metrics Bar:** Qubits, depth, operations, shots, and measured execution time.
   - **Measurement Counts Histogram:** Horizontal progress bars displaying exact observation counts and percentages.
   - **Probabilities Tab:** Theoretical vs empirical probability bars with zero-state visibility toggle.
   - **State Vector Tab:** Full complex amplitudes ($\operatorname{Re}$, $\operatorname{Im}$, magnitude, phase angle).
   - **Bloch Coordinates Tab:** Marginal expectations $\langle X \rangle, \langle Y \rangle, \langle Z \rangle$ and purity / entanglement status.
   - **Stale Detection:** If gates are placed or deleted after a run, a warning banner alerts the user: *"⚠ Circuit changed since the last simulation. Run the circuit again to update results."*
   - **Clear Results:** Resets results without altering the circuit canvas.

---

## 12. Verification & Test Report

### Automated Test Suites:
- **Backend Tests (`pytest backend/tests/ -v`):**
  - `test_auth.py` (15 tests) — **PASS**
  - `test_circuit.py` (11 tests) — **PASS**
  - `test_learning.py` (14 tests) — **PASS**
  - `test_simulation.py` (11 tests) — **PASS**
  - **Total: 51 tests passed (100%)**
- **Frontend Mathematical Verification Suite (`frontend/scripts/run_all_phase4_tests.js`):**
  - X gate test ($|1\rangle$, $P(1) = 1.0$) — **PASS**
  - Hadamard test ($P(0) = 0.5, P(1) = 0.5$) — **PASS**
  - H-H destructive interference test ($P(0) = 1.0$) — **PASS**
  - Pauli-Y and Pauli-Z tests — **PASS**
  - S and T phase rotation tests — **PASS**
  - CNOT on all 4 basis states — **PASS**
  - Bell state entanglement test — **PASS**
  - Normalization check ($\sum P = 1.0$) — **PASS**
  - Measurement shot count statistics (1000 shots) — **PASS**
  - Circuit serialization/deserialization compatibility — **PASS**
  - **Total: 25 checks passed (100%)**
- **TypeScript & Production Build (`npm run build`):**
  - `tsc && vite build` — **PASS (0 errors, 0 warnings)**

---

## 13. Phase 5 & Phase 6 Handoff

Phase 4 establishes the immutable contract required by future phases:
1. **Phase 5 (AI Tutor):**
   The AI Tutor will consume both `CanonicalCircuit` and `SimulationResult` to explain student mistakes or guide algorithm construction. The schema strictly conforms to `SimulationResult` defined in `docs/QUANTUM_SCHEMA.md`.
2. **Phase 6 (Assessment & Grading Engine):**
   The backend service `SimulationService.simulate(circuit, shots)` allows server-side verification of student homework assignments, calculating fidelity between submitted circuits and ground truth target states.
