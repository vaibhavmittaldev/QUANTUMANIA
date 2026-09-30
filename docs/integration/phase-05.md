# Phase 5 Integration Document — AI Quantum Learning Tutor

**SIH 2026 — AI-Based Interactive Quantum Algorithm Learning Platform**  
**Repository:** `QUANTUMANIA`  
**Track:** Tanishq (Phase 3: Circuit Builder $\to$ Phase 4: Quantum Simulator $\to$ **Phase 5: AI Quantum Tutor**)  
**Schema Parity:** `docs/QUANTUM_SCHEMA.md`  
**Status:** Complete & Integrated into `feature/phase-05-ai-tutor`

---

## 1. Phase Objective

Phase 5 introduces an **AI-powered quantum learning tutor** layered directly on top of the learning curriculum (Phase 2), quantum circuit builder (Phase 3), and classical quantum simulator (Phase 4).

The core operational principle is:
```text
                  LEARNING CURRICULUM (Phase 2)
                                │
                                ▼
                   QUANTUM LAB WORKBENCH
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
   QUANTUM CIRCUIT                             LESSON CONTEXT
   (Phase 3 Schema)                                   │
          │                                           │
          ▼                                           │
   SIMULATION ENGINE (Phase 4)                        │
          │                                           │
          ▼                                           │
   AUTHORITATIVE RESULT                               │
          │                                           │
          └─────────────────────┬─────────────────────┘
                                ▼
                       CONTEXT BUILDER
                                │
                                ▼
                      AI QUANTUM TUTOR
                                │
          ┌─────────────┬───────┴───────┬─────────────┐
          ▼             ▼               ▼             ▼
       Explain        Hint           Analyze        Guide
          │             │               │             │
          └─────────────┴───────┬───────┴─────────────┘
                                ▼
                             LEARNER
```

The AI tutor is strictly **grounded in the physical circuit and simulation data**. It never fabricates quantum simulation probabilities or invents phantom gates.

---

## 2. AI Architecture

The system uses a decoupled multi-tier architecture ensuring zero direct coupling between UI components and external AI providers:

```text
Frontend React UI (TutorPanel.tsx)
          │
          ▼
Frontend API Client (services/api.ts -> tutorApi.query)
          │
          ▼
FastAPI REST Endpoint (POST /api/v1/tutor/query)
          │
          ▼
Tutor Service (services/tutor/tutor_service.py)
          │
          ├── Context Builder (context_builder.py)
          └── Provider Router (providers/)
                    ├── Deterministic Pedagogical Engine (deterministic_provider.py)
                    ├── Google Gemini 1.5 Provider (gemini_provider.py)
                    └── OpenAI / Compatible Provider (openai_provider.py)
```

---

## 3. Pluggable AI Provider Abstraction

All providers inherit from the abstract base class:
```python
class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        request: TutorRequest,
        context_prompt: str,
        metadata: Dict[str, Any]
    ) -> TutorResponse:
        pass
```

### Supported Providers:
1. **Deterministic Pedagogical Engine (`DeterministicTutorProvider`):**
   - Active by default when running without external API keys or offline.
   - Grounded in quantum mechanics, Dirac notation, and deterministic state analysis.
   - Computes structured explanations for superposition, Bell pairs, GHZ tripartite entanglement, interference ($H^2 = I$), Pauli bit/phase flips, and probability vs finite sampling differences.
   - Provides progressive hints (Levels 1 to 3) and diagnoses common circuit mistakes (such as CNOT acting on unsuperposed $|0\rangle$).
2. **Google Gemini Provider (`GeminiTutorProvider`):**
   - Connects to Google's `gemini-1.5-flash` model via asynchronous REST (`httpx`).
   - Injects the authoritative system prompt and bounded context.
   - Gracefully falls back to the deterministic engine upon network error, rate limit, or invalid key.
3. **OpenAI Provider (`OpenAITutorProvider`):**
   - Connects to OpenAI compatible endpoints (`gpt-4o-mini` / `gpt-4o`).
   - Fully supports fallback to the deterministic engine.

---

## 4. API Endpoints

### 4.1. `POST /api/v1/tutor/query`
Processes an inquiry, quick action, or socratic question.

**Request Schema (`TutorRequest`):**
```json
{
  "mode": "explain",
  "message": "Explain this circuit",
  "hint_level": 1,
  "lesson_context": {
    "lesson_id": "les_03_bell_states",
    "title": "Creating Entanglement with Bell States",
    "topic": "Quantum Entanglement",
    "objectives": ["Understand Bell pairs", "Observe correlation"]
  },
  "circuit_context": {
    "qubits": 2,
    "depth": 2,
    "gate_count": 2,
    "gates_summary": [
      "H on q0 at step 0",
      "CNOT ctrl=q0 tgt=q1 at step 1"
    ]
  },
  "simulation_context": {
    "has_simulation": true,
    "is_stale": false,
    "shots": 1024,
    "probabilities": { "00": 0.5, "01": 0.0, "10": 0.0, "11": 0.5 },
    "counts": { "00": 512, "11": 512 }
  },
  "conversation": [
    { "role": "user", "content": "What does CNOT do?" }
  ]
}
```

**Response Schema (`TutorResponse`):**
```json
{
  "success": true,
  "data": {
    "mode": "explain",
    "message": "### Maximally Entangled Bell State |Φ+⟩\n\nYour circuit creates an entangled Einstein-Podolsky-Rosen (EPR) Bell pair...",
    "key_points": [
      "H creates an equal superposition on control qubit q0",
      "CNOT entangles q0 and q1 into non-separable state (|00⟩ + |11⟩)/√2",
      "Outcomes |01⟩ and |10⟩ have zero probability"
    ],
    "next_step": "Try adding Pauli-X to q0 before the H gate to generate the |Φ-⟩ Bell state.",
    "follow_up_question": "Why do you think outcomes |01⟩ and |10⟩ have zero probability?",
    "context_used": {
      "mode": "explain",
      "has_lesson": true,
      "has_circuit": true,
      "has_simulation": true,
      "is_stale": false,
      "qubits": 2,
      "gate_count": 2
    }
  }
}
```

### 4.2. `GET /api/v1/tutor/status`
Returns readiness, active provider, supported modes, and grounding sources.

---

## 5. Context Builder & Stale Detection

The `ContextBuilder` integrates:
1. **Curriculum Objectives:** Informs the tutor what concept the student is trying to learn.
2. **Canonical Circuit:** Provides exact gate ordering, control/target qubit indices, and timeline depth.
3. **Simulation Output:** Uses Phase 4 probabilities, counts, and Bloch coordinates as ground truth.
4. **Stale Handling:**
   - If the student edits the circuit after running a simulation, `is_stale = true`.
   - The tutor informs the student that previous simulation results are stale and directs them to re-run the simulation.
5. **No Simulation Handling:**
   - If a student asks "Why did I get this result?" before simulating, the tutor refuses to guess and directs the learner to click **Run Circuit**.

---

## 6. Tutor Modes

1. **`explain` (Explain Circuit):**
   Step-by-step breakdown of how statevectors evolve through the circuit.
2. **`hint` (Progressive Hints):**
   - **Level 1:** Conceptual clue (e.g., "Think about how entanglement requires superposition first").
   - **Level 2:** Operation clue (e.g., "Apply a Hadamard gate before your entangler").
   - **Level 3:** Actionable instruction (e.g., "Place H on q0 at step 0, then CNOT(q0, q1) at step 1").
3. **`ask` (Free-form Inquiry):**
   Direct answers to student questions grounded in the active circuit and simulation.
4. **`guide` (What Should I Try?):**
   Suggests logical next learning steps and experiments based on the current circuit state.
5. **`analyze` (Analyze My Circuit):**
   Diagnoses common student bugs (e.g., CNOT acting on unsuperposed $|0\rangle$, gate collisions, stale data).

---

## 7. Security & Privacy Guardrails

- **Server-Side API Key Storage:** External API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) are kept exclusively on the backend server (`backend/app/core/config.py`).
- **No Client Exposure:** Zero secret tokens exist in frontend bundles or `localStorage`.
- **Bounded Context:** User passwords, authentication tokens, and unrelated database records are never passed to the context builder.
- **Prompt Injection Defense:** Strict system instructions prevent learner inputs from overriding pedagogical guardrails.

---

## 8. Verification & Test Report

### Automated Test Suites:
- **Backend Tests (`pytest backend/tests/ -v`):**
  - `test_auth.py` (15 tests) — **PASS**
  - `test_circuit.py` (11 tests) — **PASS**
  - `test_learning.py` (14 tests) — **PASS**
  - `test_simulation.py` (11 tests) — **PASS**
  - `test_tutor.py` (11 tests) — **PASS**
  - **Total: 62 tests passed (100%)**
- **Frontend Mathematical Verification (`node frontend/scripts/run_all_phase4_tests.js`):**
  - **25 / 25 checks passed (100%)**
- **TypeScript & Production Build (`npm run build`):**
  - `tsc && vite build` — **PASS (0 errors, 0 warnings)**

---

## 9. Phase 6 Assessment Engine Handoff

Phase 5 establishes the pedagogical foundation for Phase 6:
1. **Automated Assessment Feedback:**
   Phase 6 can invoke `TutorService.process_request(request)` with `mode="analyze"` to provide automated feedback when a student's homework circuit does not match the expected statevector fidelity.
2. **Socratic Guidance:**
   Instead of giving numerical grades alone, Phase 6 can use progressive hint levels to steer students toward the correct solution.
