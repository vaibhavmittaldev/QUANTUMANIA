# Integration & Cross-Developer Guide

## 1. Purpose

This document provides clear integration instructions for **Vaibhav** and **Tanishq** during parallel development. It details how independently developed components connect together without merge friction.

---

## 2. Component Integration Matrix

| Producer Component | Consumer Component | Interface / Contract | Hand-off Mechanism |
| :--- | :--- | :--- | :--- |
| **Circuit Builder** (Tanishq, Phase 3) | **Learning Sandbox** (Vaibhav, Phase 2) | React Component Props & `CanonicalCircuit` | Exported as `<CircuitBuilder initialCircuit={...} onChange={...} />` |
| **Circuit Builder** (Tanishq, Phase 3) | **Simulator API** (Tanishq, Phase 4) | `POST /api/v1/simulate` | Sends `CanonicalCircuit` JSON |
| **Simulator API** (Tanishq, Phase 4) | **Visualizer** (Tanishq, Phase 4) | `SimulationResult` JSON | Passed directly to `<HistogramView />` and `<BlochSphereView />` |
| **Simulator API** (Tanishq, Phase 4) | **Challenge Grader** (Vaibhav, Phase 6) | `SimulatorEngine.execute(circuit)` | Backend Python service call in `assessment_service.py` |
| **Simulator + Context** (Tanishq, Phase 4) | **AI Tutor Dock** (Tanishq, Phase 5) | `POST /api/v1/ai/explain` | Context builder gathers state and queries LLM |
| **Application Shell** (Vaibhav, Phase 1) | **All Subsystems** | React Router / Root Layout | Embedded in `<AppShell>` main view container |

---

## 3. Mocking Strategy for Parallel Velocity

To enable 100% parallel work without waiting for dependencies, use the provided Phase 0 mock fixtures:

### 3.1. How Vaibhav Mocks Tanishq's Simulator in Phase 2 & Phase 6
Before Tanishq finishes Phase 4, Vaibhav can test lesson circuit previews and automated challenge grading using a static mock helper:

```python
# backend/tests/mocks/mock_simulator.py
from app.schemas.simulation import SimulationResult

MOCK_BELL_RESULT = {
    "success": True,
    "shots": 1024,
    "counts": {"00": 512, "11": 512},
    "probabilities": {"00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5},
    "statevector": [
        {"basis": "00", "real": 0.7071, "imag": 0.0, "magnitude": 0.5, "phase_rad": 0.0},
        {"basis": "01", "real": 0.0, "imag": 0.0, "magnitude": 0.0, "phase_rad": 0.0},
        {"basis": "10", "real": 0.0, "imag": 0.0, "magnitude": 0.0, "phase_rad": 0.0},
        {"basis": "11", "real": 0.7071, "imag": 0.0, "magnitude": 0.5, "phase_rad": 0.0}
    ],
    "bloch_vectors": [
        {"qubit": 0, "x": 0.0, "y": 0.0, "z": 0.0},
        {"qubit": 1, "x": 0.0, "y": 0.0, "z": 0.0}
    ],
    "execution_time_ms": 1.2
}
```

### 3.2. How Tanishq Mocks Vaibhav's Auth & Lessons in Phase 3 & 4
Before Vaibhav finishes Phase 1 & 2, Tanishq can develop the Circuit Builder and Simulator locally:
- Use sandbox mode: bypass `Authorization` headers on local `/api/v1/simulate` during development.
- Use the sample circuit JSON fixtures located in `docs/QUANTUM_SCHEMA.md`.

---

## 4. Cross-Feature Verification Checklist

Before opening a pull request to merge a feature into `develop`:

1. **Contract Compliance**:
   - Does all circuit input validate against `docs/QUANTUM_SCHEMA.md`?
   - Do all API responses adhere to `{ success: true, data: { ... } }`?
2. **Qubit Ordering Consistency**:
   - Is Qubit 0 rendered at the top of the canvas?
   - Is Qubit 0 treated as the least significant bit in statevector strings (e.g. $|q_1 q_0\rangle$)?
3. **No Hardcoded Secrets**:
   - Are all API keys loaded via `os.getenv` or `process.env` referencing `.env.example`?
4. **Git Hygiene**:
   - Are changes strictly contained within your owned directories (`docs/TEAM_OWNERSHIP.md`)?
   - Does your PR follow `.github/pull_request_template.md`?
