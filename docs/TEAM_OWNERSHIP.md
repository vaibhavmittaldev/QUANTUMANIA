# Team Ownership and Governance

This document establishes the official developer ownership boundaries, shared contract policies, and collaboration workflow for the **AI-Based Interactive Quantum Algorithm Learning Platform (QUANTUMANIA)** (SIH 2026).

---

## 1. Developer Ownership Matrix

The project is split strictly across two developers to maximize velocity, enable asynchronous work, and eliminate merge conflicts.

| Phase | Description | Lead Developer | Primary Code Locations |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Project Foundation & Architecture Contracts | **Vaibhav** | Root configuration, `docs/*`, `.github/*` |
| **Phase 1** | Authentication + Application Shell | **Vaibhav** | `frontend/src/features/auth/`, `frontend/src/components/layout/`, `backend/app/api/v1/endpoints/auth.py`, `backend/app/services/auth_service.py` |
| **Phase 2** | Learning Engine + Curriculum | **Vaibhav** | `frontend/src/features/learning/`, `backend/app/api/v1/endpoints/learning.py`, `backend/app/services/learning_service.py` |
| **Phase 3** | Quantum Circuit Builder (Canvas & Palette) | **Tanishq** | `frontend/src/features/circuit-builder/`, `backend/app/schemas/circuit.py`, `backend/app/api/v1/endpoints/quantum.py` |
| **Phase 4** | Quantum Simulator + Visualization Engine | **Tanishq** | `backend/app/services/quantum_engine/`, `frontend/src/features/simulation/` (Bloch sphere, histograms, statevector) |
| **Phase 5** | AI Quantum Tutor (Grounded Assistant) | **Tanishq** | `backend/app/services/ai_tutor/`, `backend/app/api/v1/endpoints/ai.py`, `frontend/src/features/ai-tutor/` |
| **Phase 6** | Assessment Engine, Challenges & Progress | **Vaibhav** | `frontend/src/features/assessment/`, `backend/app/api/v1/endpoints/assessment.py`, `backend/app/api/v1/endpoints/progress.py` |
| **Phase 7** | System Integration, Verification & MVP Hardening | **Vaibhav** | End-to-end integration tests, release candidate packaging, polish |

---

## 2. Shared Contracts Policy

Shared contracts are canonical specifications that both developers depend upon. Once Phase 0 completes, **unilateral modifications to shared contracts are strictly forbidden**.

### Shared Contract Files:
1. `docs/QUANTUM_SCHEMA.md` — Quantum circuit data structure, supported gates, and simulation result format.
2. `docs/API_CONTRACT.md` — REST API endpoint paths, query parameters, payloads, and response envelopes.
3. `docs/DATABASE.md` — Relational schema definitions, table entities, attributes, and relationships.
4. `docs/AI_ARCHITECTURE.md` — Context assembly rules and simulation grounding guarantees.
5. `docs/UI_SYSTEM.md` — Design tokens, color system, and reusable UI conventions.

### Modification Rules:
- **Two-Party Review**: Any pull request that touches files in `docs/` or shared schema definitions in `frontend/src/types/` or `backend/app/schemas/` requires explicit approval from **both Vaibhav and Tanishq**.
- **Change Request Process**:
  1. Open a GitHub Issue using the `Architecture Proposal` template (`.github/ISSUE_TEMPLATE/architecture_proposal.md`).
  2. Discuss the rationale and trade-offs.
  3. Update the specification document first.
  4. Implement downstream changes in frontend and backend simultaneously.

---

## 3. Directory & File Isolation

To prevent git conflicts, code is partitioned into isolated folders:

```
frontend/src/features/
├── auth/            <-- Vaibhav ONLY
├── learning/        <-- Vaibhav ONLY
├── circuit-builder/ <-- Tanishq ONLY
├── simulation/      <-- Tanishq ONLY
├── ai-tutor/        <-- Tanishq ONLY
└── assessment/      <-- Vaibhav ONLY

backend/app/
├── api/v1/endpoints/
│   ├── auth.py          <-- Vaibhav
│   ├── learning.py      <-- Vaibhav
│   ├── quantum.py       <-- Tanishq
│   ├── ai.py            <-- Tanishq
│   ├── assessment.py    <-- Vaibhav
│   └── progress.py      <-- Vaibhav
└── services/
    ├── auth_service.py       <-- Vaibhav
    ├── learning_service.py   <-- Vaibhav
    ├── quantum_engine/       <-- Tanishq
    ├── ai_tutor/             <-- Tanishq
    └── assessment_service.py <-- Vaibhav
```

---

## 4. Git Branching Strategy

- **Main Branch (`main`)**: Production-ready code only. Direct commits are blocked.
- **Development Branch (`develop`)**: Integration branch for verified feature work.
- **Feature Branches**:
  - Vaibhav branches: `feature/vaibhav/<phase-number>-<feature-name>` (e.g. `feature/vaibhav/phase-01-auth`)
  - Tanishq branches: `feature/tanishq/<phase-number>-<feature-name>` (e.g. `feature/tanishq/phase-03-circuit-builder`)
  - Shared contract amendments: `contract/<proposal-name>` (requires dual sign-off).

---

## 5. Conflict Resolution Protocol

In case of merge conflicts or schema ambiguities:
1. The developer whose owned subsystem is impacted leads the technical resolution.
2. The specifications in `docs/QUANTUM_SCHEMA.md` and `docs/API_CONTRACT.md` are the single source of truth.
3. If an unresolvable dispute arises regarding architecture, refer to `docs/ARCHITECTURE.md` and the MVP objectives outlined in `docs/PRD.md`.
