# Phase 2 — Learning + Curriculum Integration Guide

**SIH 2026 — AI-Based Interactive Quantum Algorithm Learning Platform (QUANTUMANIA)**  
**Developer Track:** Vaibhav (Foundation, Auth, Learning, Assessment, Integration)  
**Branch:** `feature/phase-02-learning`  
**Status:** COMPLETE  

---

## 1. Objective

Phase 2 establishes the foundational educational content architecture and real-time learner progress tracking system. Rather than hardcoding static content into page components, Phase 2 implements a data-driven curriculum engine:

```text
Course  ──▶  Modules (5)  ──▶  Lessons (20)  ──▶  Structured Content Blocks
                                                     ├── Text & Headings
                                                     ├── Dirac Equations (|0⟩, |1⟩, |ψ⟩)
                                                     ├── Callouts & Warnings
                                                     ├── Code Snippets
                                                     └── Interactive Quantum Lab Hooks
```

The system ensures that learner progress is real, database-backed, resilient across sessions, and accurately reflected in both the course syllabus and the central dashboard.

---

## 2. Curriculum Structure

The canonical curriculum dataset is initialized at system startup via `backend/app/services/curriculum_data.py` and persisted in relational database tables.

### Course

* **ID**: `crs_intro_quantum`
* **Title**: Introduction to Quantum Computing
* **Slug**: `intro-to-quantum-computing`
* **Difficulty**: `beginner`
* **Estimated Time**: 6 hours
* **Total Modules**: 5
* **Total Lessons**: 20

---

### Modules & Lessons Breakdown

#### Module 1: Quantum Computing Foundations (`mod_foundations`)
1. **Lesson 1** (`les_01_what_is_qc`): *What is Quantum Computing?* (Classical transistors vs quantum paradigms, Moore's Law limits, specific speedup domains)
2. **Lesson 2** (`les_02_bits_vs_qubits`): *Bits vs Qubits* (Deterministic binary states vs 2-level quantum Hilbert spaces, $|0\rangle = [1, 0]^T$, $|1\rangle = [0, 1]^T$)
3. **Lesson 3** (`les_03_superposition`): *Superposition* (Linear combinations $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$, normalization $|\alpha|^2 + |\beta|^2 = 1$, why it is not "0 and 1 simultaneously")
4. **Lesson 4** (`les_04_measurement`): *Measurement and Wavefunction Collapse* (Projective Born rule measurement, collapse to basis states, non-deterministic sampling)

#### Module 2: Quantum States and Gates (`mod_states_gates`)
5. **Lesson 5** (`les_05_quantum_states`): *Quantum States & Dirac Notation* (Bra-ket algebra, state vectors, inner products $\langle\phi|\psi\rangle$)
6. **Lesson 6** (`les_06_quantum_gates`): *Introduction to Quantum Gates* (Unitary operations $U^\dagger U = I$, reversibility, geometric sphere rotations)
7. **Lesson 7** (`les_07_hadamard_gate`): *The Hadamard Gate* ($H$ matrix, transforming basis states into uniform superpositions $H|0\rangle = |+\rangle$, $H|1\rangle = |-\rangle$)
8. **Lesson 8** (`les_08_pauli_gates`): *Pauli Gates (X, Y, Z)* (Pauli-X bit flip, Pauli-Z phase flip, Pauli-Y bit-phase flip)

#### Module 3: Multi-Qubit Computing (`mod_multi_qubit`)
9. **Lesson 9** (`les_09_multiple_qubits`): *Multiple Qubits & Tensor Products* (Tensor product states, composite spaces $\mathbb{C}^4$, basis $|00\rangle, |01\rangle, |10\rangle, |11\rangle$)
10. **Lesson 10** (`les_10_controlled_operations`): *Controlled Operations & CNOT* (Control vs target qubits, Controlled-NOT truth table and matrix)
11. **Lesson 11** (`les_11_entanglement`): *Quantum Entanglement* (Non-separable states, Einstein-Podolsky-Rosen paradox, quantum non-locality)
12. **Lesson 12** (`les_12_bell_states`): *Bell States & EPR Pairs* (Constructing $|\Phi^+\rangle = \frac{1}{\sqrt{2}}(|00\rangle + |11\rangle)$ with $H(q_0)$ followed by $CNOT(q_0, q_1)$; **Includes Phase 3 Quantum Lab integration trigger**)

#### Module 4: Quantum Algorithms (`mod_algorithms`)
13. **Lesson 13** (`les_13_quantum_algorithms`): *What is a Quantum Algorithm?* (Quantum circuits, phase kickback, quantum interference, quantum advantage)
14. **Lesson 14** (`les_14_deutsch_algorithm`): *Deutsch's Algorithm* (Determining whether a black-box oracle $f(x)$ is constant or balanced in a single evaluation)
15. **Lesson 15** (`les_15_grover_algorithm`): *Grover's Search Algorithm* (Unstructured search speedup from $O(N)$ to $O(\sqrt{N})$, oracle reflection and diffusion operator)
16. **Lesson 16** (`les_16_qft`): *Quantum Fourier Transform (QFT)* (Discrete Fourier transform on quantum amplitudes, basis for Shor's factoring algorithm)

#### Module 5: Quantum Programming (`mod_programming`)
17. **Lesson 17** (`les_17_intro_to_qiskit`): *Introduction to Qiskit* (QuantumCircuit, QuantumRegister, ClassicalRegister, assembling gates in Python)
18. **Lesson 18** (`les_18_building_first_circuit`): *Building Your First Circuit* (Constructing a superposition circuit in Qiskit; **Includes Phase 3 Quantum Lab integration trigger**)
19. **Lesson 19** (`les_19_running_circuit`): *Simulating Quantum Circuits* (AerSimulator, execution shots, measurement histograms, shot noise)
20. **Lesson 20** (`les_20_from_circuit_to_result`): *From Circuit to Result* (End-to-end execution pipeline: Circuit $\to$ Transpilation $\to$ Execution $\to$ Counts $\to$ State Interpretation)

---

## 3. Content Block Schema

Lessons are composed of typed JSON content blocks rendered by `ContentBlockRenderer.tsx`:

```json
{
  "type": "heading | subheading | text | callout | equation | code | bullet_list | numbered_list | example",
  "content": "String content or markdown text",
  "title": "Optional callout/example heading",
  "variant": "info | tip | warning | formula",
  "language": "python | text | qasm",
  "items": ["Optional array for bullet_list or numbered_list"]
}
```

### Mathematical Equation Rendering
Dirac notation expressions (e.g. $|0\rangle$, $|1\rangle$, $|\psi\rangle$, $\alpha|0\rangle + \beta|1\rangle$) are rendered using styled mathematical display blocks with monospaced typography, subtle glow accents, and accessible aria-labels.

---

## 4. Database Schema Changes

Four new models were defined in `backend/app/db/models/learning.py` under the existing SQLAlchemy Base:

```text
Course (1) ───< Module (N) ───< Lesson (N)
                                    │
                                    └──< LessonProgress (N) >─── User (1)
```

1. **`courses`**:
   - `id` (PK, string), `title`, `slug` (unique), `description`, `difficulty`, `is_published`, `display_order`, `estimated_hours`.
2. **`modules`**:
   - `id` (PK, string), `course_id` (FK $\to$ `courses.id`), `title`, `slug`, `description`, `display_order`.
3. **`lessons`**:
   - `id` (PK, string), `module_id` (FK $\to$ `modules.id`), `title`, `slug`, `description`, `estimated_minutes`, `difficulty`, `xp_reward`, `display_order`, `objectives_json` (JSON), `content_blocks_json` (JSON), `content_markdown` (Text), `initial_circuit_json` (JSON nullable), `interactive_meta_json` (JSON nullable).
4. **`lesson_progress`**:
   - `id` (PK, UUID), `user_id` (FK $\to$ `users.id`), `lesson_id` (FK $\to$ `lessons.id`), `is_completed` (Boolean), `started_at` (DateTime), `completed_at` (DateTime nullable).
   - **Unique Constraint**: `uq_user_lesson` on `(user_id, lesson_id)` preventing duplicate records.

---

## 5. API Endpoints

All endpoints adhere to the standard envelope `{ "success": boolean, "data": ... }` or `{ "success": false, "error": { "code": "...", "message": "..." } }`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/courses` | Optional | List all published courses with module counts and user progress |
| `GET` | `/api/v1/courses/{course_id}` | Optional | Retrieve course detail, module summaries, and completion % |
| `GET` | `/api/v1/modules/{module_id}` | Optional | Retrieve module detail with learning objectives and lesson list |
| `GET` | `/api/v1/lessons/{lesson_id}` | Optional | Get full lesson content blocks, objectives, and navigation pointers |
| `POST` | `/api/v1/lessons/{lesson_id}/start` | Required | Mark lesson started for authenticated user |
| `POST` | `/api/v1/lessons/{lesson_id}/complete` | Required | Mark lesson complete, award XP to profile, return next lesson ID |
| `GET` | `/api/v1/learning/progress` | Required | Get overall learning progress, module metrics, resume pointer, and recent completions |

---

## 6. Progress Calculation & Formula

* **Module Progress**:
  $$\text{Module Progress} = \left(\frac{\text{Completed Lessons in Module}}{\text{Total Lessons in Module}}\right) \times 100\%$$
* **Course Progress**:
  $$\text{Course Progress} = \left(\frac{\text{Completed Lessons in Course}}{\text{Total Lessons in Course}}\right) \times 100\%$$
* **Resume Pointer (`recent_incomplete_lesson`)**:
  Identifies the first incomplete lesson in course display sequence (`Module.display_order ASC, Lesson.display_order ASC`). If all 20 lessons are completed, returns `null` and the dashboard reflects full course completion.
* **XP Awarding**:
  Each lesson completion awards 25 XP points to the user's profile (`user.profile.total_xp`). Idempotent: repeated completions do not award duplicate points.

---

## 7. Frontend Architecture & Routes

### Routes (Inside Protected AppShell)
- `/app/learn` $\to$ `<CoursePage />`: Syllabus overview, overall progress indicator, search & difficulty filters, and interactive module cards.
- `/app/learn/modules/:moduleId` $\to$ `<ModulePage />`: Detailed module overview, measurable learning objectives checklist, and lesson progress statuses.
- `/app/learn/lessons/:lessonId` $\to$ `<LessonPage />`: Distraction-free lesson viewer with collapsible course navigation sidebar, content block rendering, previous/next navigation buttons, and "Mark Lesson Complete" toggle.
- `/app/dashboard` $\to$ `<DashboardPage />`: Connected to real learning progress with resume card, module progress bars, total completed lessons, and recent activity audit log.

### Reusable UI Components
- `ContentBlockRenderer.tsx`: Modular rendering engine supporting 9 distinct educational content types.
- `CoursePage.tsx`: Course catalog and module syllabus.
- `ModulePage.tsx`: Module objectives and lesson listing.
- `LessonPage.tsx`: Lesson viewer with sidebar navigation and interactive triggers.

---

## 8. Verification & Testing

### Automated Test Coverage
- **`backend/tests/test_learning.py`** (14 tests):
  - Curriculum data integrity and completeness (20 lessons, 5 modules)
  - Public vs authenticated course access
  - Lesson navigation chains (first, middle, last lesson boundary cases)
  - Unauthenticated access rejection for completion actions
  - Completion idempotency and XP calculation
  - Module & Course progress percentage mathematical formulas
  - Cross-user data isolation (User A progress cannot leak to User B)
- **`backend/tests/test_auth.py`** (15 tests):
  - Registration, login, profile updates, and token lifecycle.
- **Total Backend Tests**: **29 / 29 passed (100%)**.

### Frontend Production Build
- `npm run build` executed cleanly with zero TypeScript errors and zero warnings (`dist/` bundle created: 273.71 kB JS, 5.99 kB CSS).

---

## 9. Future Integration Points

### Phase 3 Integration (Tanishq — Quantum Circuit Builder)
Lessons that introduce circuit building (Lesson 12: Bell States, Lesson 18: Building Your First Circuit) define an `interactive` metadata payload in their JSON schema:
```json
{
  "interactive": {
    "type": "quantum_lab",
    "templateId": "bell-state",
    "label": "Open in Quantum Lab"
  }
}
```
When `interactive.type === "quantum_lab"`, `LessonPage.tsx` automatically renders an **"Open in Quantum Lab"** action button. In Phase 3, clicking this button can route directly to `/app/quantum-lab?template={templateId}`, allowing Tanishq's circuit builder to pre-load the relevant quantum circuit.

### Phase 6 Integration (Vaibhav — Assessment Engine)
Lessons support an optional `assessment_id` relationship. Phase 6 can attach quiz questions or validation challenges at the end of each lesson before triggering `complete_lesson`.

### Phase 7 Integration (Vaibhav — Final Polish & MVP Hardening)
Phase 7 will integrate offline caching, comprehensive search indexing across all lesson markdown, and end-to-end certification generation upon reaching 100% course completion.
