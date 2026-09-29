# Canonical Quantum Circuit & Simulation Result Specification

## 1. Overview & Purpose

This document defines the **single canonical representation** for quantum circuits and simulation outputs across the **QUANTUMANIA** platform. 

This contract is the core technical boundary between:
- **Tanishq's Modules**: Circuit Builder (Phase 3), Quantum Simulator & Visualizations (Phase 4), AI Tutor (Phase 5).
- **Vaibhav's Modules**: Curriculum / Lesson Circuit Previews (Phase 2), Assessment & Challenge Grader (Phase 6), Progress Tracking (Phase 6).

> **CRITICAL ARCHITECTURAL RULE**:
> All components MUST consume and produce this exact JSON format. No module may introduce an incompatible, private, or ad-hoc circuit format.

---

## 2. Versioning Strategy

All circuit payloads must declare a semantic version:
- **Current MVP Version**: `"1.0.0"`
- Schema field: `"schema_version": "1.0.0"`
- Breaking schema changes require incrementing the major version and receiving joint approval from both developers (see `docs/TEAM_OWNERSHIP.md`).

---

## 3. Circuit Representation (`CanonicalCircuit`)

### 3.1. JSON Schema Definition

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CanonicalCircuit",
  "type": "object",
  "required": ["schema_version", "qubits", "classical_bits", "gates"],
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": ["1.0.0"]
    },
    "name": {
      "type": "string",
      "description": "Optional human-readable title of the circuit"
    },
    "description": {
      "type": "string",
      "description": "Optional markdown notes or circuit purpose"
    },
    "qubits": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10,
      "description": "Total number of quantum wires (qubits) allocated"
    },
    "classical_bits": {
      "type": "integer",
      "minimum": 0,
      "maximum": 10,
      "description": "Total number of classical register bits allocated for measurement outcomes"
    },
    "gates": {
      "type": "array",
      "description": "Ordered sequence of quantum gate operations executed sequentially",
      "items": {
        "$ref": "#/$defs/QuantumGate"
      }
    },
    "measurements": {
      "type": "array",
      "description": "Optional explicit measurement mappings from qubit to classical bit",
      "items": {
        "type": "object",
        "required": ["qubit", "classical_bit"],
        "properties": {
          "qubit": { "type": "integer", "minimum": 0 },
          "classical_bit": { "type": "integer", "minimum": 0 }
        }
      }
    }
  },
  "$defs": {
    "QuantumGate": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "id": {
          "type": "string",
          "description": "Optional unique UUID for frontend drag-and-drop tracking"
        },
        "type": {
          "type": "string",
          "enum": ["X", "Y", "Z", "H", "CNOT", "MEASURE", "S", "T", "RX", "RY", "RZ", "SWAP", "CZ"]
        },
        "targets": {
          "type": "array",
          "items": { "type": "integer", "minimum": 0 },
          "description": "Target qubit indices where the gate operation is applied"
        },
        "target": {
          "type": "integer",
          "minimum": 0,
          "description": "Single target qubit index (shorthand for single-qubit gates or CNOT target)"
        },
        "control": {
          "type": "integer",
          "minimum": 0,
          "description": "Control qubit index (required for controlled gates like CNOT or CZ)"
        },
        "controls": {
          "type": "array",
          "items": { "type": "integer", "minimum": 0 },
          "description": "Multiple control qubit indices for multi-controlled gates"
        },
        "params": {
          "type": "object",
          "description": "Optional continuous parameters (e.g. angle theta for rotation gates)",
          "properties": {
            "theta": { "type": "number" },
            "phi": { "type": "number" },
            "lambda": { "type": "number" }
          }
        },
        "step": {
          "type": "integer",
          "minimum": 0,
          "description": "Optional timeline column / time slice index for 2D visual layout alignment"
        }
      }
    }
  }
}
```

### 3.2. Canonical Circuit Example (Bell State $|\Phi^+\rangle$)

```json
{
  "schema_version": "1.0.0",
  "name": "Bell State Preparation",
  "description": "Creates an entangled Bell pair: (|00> + |11>) / sqrt(2)",
  "qubits": 2,
  "classical_bits": 2,
  "gates": [
    {
      "id": "gate-1",
      "type": "H",
      "targets": [0],
      "step": 0
    },
    {
      "id": "gate-2",
      "type": "CNOT",
      "control": 0,
      "target": 1,
      "step": 1
    }
  ],
  "measurements": [
    { "qubit": 0, "classical_bit": 0 },
    { "qubit": 1, "classical_bit": 1 }
  ]
}
```

---

## 4. Qubit & Bit Indexing Conventions

### 4.1. Indexing
* **Qubit Indices**: `0, 1, 2, ..., (qubits - 1)`. 0-indexed.
* **Classical Bit Indices**: `0, 1, 2, ..., (classical_bits - 1)`. 0-indexed.

### 4.2. Tensor Product & Bitstring Endianness (CRITICAL)
In multi-qubit systems, confusion often arises regarding whether qubit 0 represents the Most Significant Bit (MSB) or Least Significant Bit (LSB).

**QUANTUMANIA Standard Convention (Qiskit / Little-Endian Standard)**:
- **Bitstring Representation**: $|q_{n-1} \dots q_1 q_0\rangle$
- **Qubit 0** corresponds to the **rightmost (Least Significant) bit**.
- **Qubit $(n-1)$** corresponds to the **leftmost (Most Significant) bit**.
- Example for 2 qubits ($n=2$):
  - State $|01\rangle$: Qubit 1 is $|0\rangle$, Qubit 0 is $|1\rangle$.
  - State index $k = \sum_{j=0}^{n-1} q_j \cdot 2^j$. For $|01\rangle$, index is $k = 0\cdot 2^1 + 1\cdot 2^0 = 1$.
- In the frontend circuit wire diagram:
  - Wire index `0` is rendered at the **TOP**.
  - Wire index `(n-1)` is rendered at the **BOTTOM**.

Both simulator calculations, statevector slicing, measurement strings, and visualizer tables must adhere to this convention.

---

## 5. Supported Gate Types

### 5.1. MVP Supported Gates (Must Be Fully Supported in Phase 3 & 4)

| Gate Type | Description | Matrix / Action | Target / Control Rules |
| :--- | :--- | :--- | :--- |
| `X` | Pauli-X (NOT / Bit-flip) | $\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$ | Single target qubit (`targets: [q]` or `target: q`) |
| `Y` | Pauli-Y (Bit + Phase flip) | $\begin{pmatrix} 0 & -i \\ i & 0 \end{pmatrix}$ | Single target qubit |
| `Z` | Pauli-Z (Phase flip) | $\begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}$ | Single target qubit |
| `H` | Hadamard (Superposition) | $\frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$ | Single target qubit |
| `CNOT` | Controlled-NOT (CX) | Controlled bit-flip | `control: c`, `target: t` with $c \ne t$ |
| `MEASURE` | Projective Measurement | Collapses state onto computational basis | `qubit: q`, `classical_bit: c` |

### 5.2. Post-MVP Extensible Gates (Schema Compatible)
- `S` (Phase $\pi/2$): $\begin{pmatrix} 1 & 0 \\ 0 & i \end{pmatrix}$
- `T` ($\pi/8$ gate): $\begin{pmatrix} 1 & 0 \\ 0 & e^{i\pi/4} \end{pmatrix}$
- `SWAP`: Swaps state of two qubits (`targets: [q1, q2]`)
- `CZ`: Controlled-Z (`control: c`, `target: t`)
- `RX`, `RY`, `RZ`: Parametric rotations around Bloch sphere axes (`params: { "theta": 1.5708 }`)

---

## 6. Validation Rules & Constraint Checks

Before executing simulation or grading, the backend `SimulatorEngine` and frontend validation helpers must enforce:

1. **Qubit Allocation Limits**: $1 \le \text{qubits} \le 10$ for the MVP (avoids computational exhaustion on server).
2. **Bounds Check**: For every gate and measurement, all qubit indices must satisfy $0 \le q < \text{qubits}$ and classical bit indices $0 \le c < \text{classical\_bits}$.
3. **Control-Target Distinctness**: For 2-qubit gates (`CNOT`, `CZ`, `SWAP`), control and target must not point to the same qubit ($c \ne t$).
4. **Collision Check**: At any given visual `step`, no two gates may occupy or act upon the same qubit simultaneously.
5. **Measurement Integrity**: Qubits measured multiple times must overwrite or sequence classical register bits properly.

---

## 7. Error Codes & Schemas

When validation fails, the response must return `HTTP 400` with the standardized error format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CIRCUIT",
    "message": "Control qubit index (0) and target qubit index (0) cannot be identical.",
    "details": {
      "gate_index": 1,
      "gate_type": "CNOT",
      "violation": "CONTROL_EQUALS_TARGET"
    }
  }
}
```

Standard Error Codes:
- `SCHEMA_VALIDATION_ERROR`: Missing required fields or invalid property types.
- `QUBIT_OUT_OF_BOUNDS`: Qubit index exceeds allocated qubit count.
- `CONTROL_EQUALS_TARGET`: Multi-qubit gate references identical control and target.
- `MAX_QUBITS_EXCEEDED`: Circuit specifies more than 10 qubits for MVP.
- `SIMULATION_TIMEOUT`: Computation exceeded time threshold (e.g. 5000 ms).

---

## 8. Simulation Result Contract (`SimulationResult`)

This is the output generated by **Tanishq's Simulator** (Phase 4), consumed by the **Visualizer**, **AI Tutor**, and **Vaibhav's Assessment Engine**.

### 8.1. Simulation Result Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SimulationResult",
  "type": "object",
  "required": ["success", "shots", "counts", "probabilities", "statevector", "execution_time_ms"],
  "properties": {
    "success": {
      "type": "boolean"
    },
    "shots": {
      "type": "integer",
      "minimum": 1,
      "maximum": 8192,
      "description": "Total number of measurement shots executed (0 for analytical statevector only)"
    },
    "counts": {
      "type": "object",
      "additionalProperties": { "type": "integer" },
      "description": "Histogram dictionary mapping bitstrings to observation counts"
    },
    "probabilities": {
      "type": "object",
      "additionalProperties": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
      "description": "Normalized theoretical or empirical probability for each basis state"
    },
    "statevector": {
      "type": "array",
      "description": "Complex amplitudes for the 2^n state basis ordered from 0 to 2^n - 1",
      "items": {
        "type": "object",
        "required": ["basis", "real", "imag", "magnitude", "phase_rad"],
        "properties": {
          "basis": { "type": "string", "description": "Binary state string (e.g. '00', '01')" },
          "real": { "type": "number", "description": "Real component of amplitude" },
          "imag": { "type": "number", "description": "Imaginary component of amplitude" },
          "magnitude": { "type": "number", "description": "|amplitude|^2 probability value" },
          "phase_rad": { "type": "number", "description": "Phase angle in radians [-pi, pi]" }
        }
      }
    },
    "bloch_vectors": {
      "type": "array",
      "description": "Reduced single-qubit Bloch coordinates (x, y, z) for separable or marginal states",
      "items": {
        "type": "object",
        "required": ["qubit", "x", "y", "z"],
        "properties": {
          "qubit": { "type": "integer" },
          "x": { "type": "number" },
          "y": { "type": "number" },
          "z": { "type": "number" }
        }
      }
    },
    "execution_time_ms": {
      "type": "number",
      "description": "Wall-clock computation latency in milliseconds"
    }
  }
}
```

### 8.2. Simulation Result Example (Bell State $|\Phi^+\rangle$ with 1024 shots)

```json
{
  "success": true,
  "shots": 1024,
  "counts": {
    "00": 516,
    "11": 508
  },
  "probabilities": {
    "00": 0.50390625,
    "01": 0.0,
    "10": 0.0,
    "11": 0.49609375
  },
  "statevector": [
    {
      "basis": "00",
      "real": 0.70710678,
      "imag": 0.0,
      "magnitude": 0.5,
      "phase_rad": 0.0
    },
    {
      "basis": "01",
      "real": 0.0,
      "imag": 0.0,
      "magnitude": 0.0,
      "phase_rad": 0.0
    },
    {
      "basis": "10",
      "real": 0.0,
      "imag": 0.0,
      "magnitude": 0.0,
      "phase_rad": 0.0
    },
    {
      "basis": "11",
      "real": 0.70710678,
      "imag": 0.0,
      "magnitude": 0.5,
      "phase_rad": 0.0
    }
  ],
  "bloch_vectors": [
    { "qubit": 0, "x": 0.0, "y": 0.0, "z": 0.0 },
    { "qubit": 1, "x": 0.0, "y": 0.0, "z": 0.0 }
  ],
  "execution_time_ms": 2.45
}
```

> **Note on Entanglement & Bloch Sphere**:
> When two qubits are maximally entangled (such as in $|\Phi^+\rangle$), their individual reduced density matrices are maximally mixed, resulting in Bloch vector $(0,0,0)$. The visualizer should handle mixed states gracefully by rendering a point at the sphere origin or displaying an "Entangled State" indicator badge.
