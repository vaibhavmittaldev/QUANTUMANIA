# Phase 6 Integration Document — Adaptive Learning & Learner Intelligence

**SIH 2026 — AI-Based Interactive Quantum Algorithm Learning Platform**  
**Repository:** `QUANTUMANIA`  
**Working Branch:** `feature/phase-06-adaptive-learning`  
**Status:** Complete, Verified & Regression Tested  

---

## 1. Phase Objective

Phase 6 transforms QUANTUMANIA from a static quantum-learning platform into an **adaptive learning platform**.

The system dynamically understands:
* What the learner has studied and completed
* Which quantum concepts they understand
* Which concepts they struggle with
* Which circuits they build and simulate
* How they interact with the AI tutor
* What assessments they attempt
* What topics should be practiced next

The core learning loop becomes:
```text
Learn
  ↓
Practice
  ↓
Build Circuit
  ↓
Simulate
  ↓
Ask AI Tutor
  ↓
Measure Learning Activity
  ↓
Estimate Topic Mastery
  ↓
Identify Weak Areas
  ↓
Recommend Next Activity
  ↓
Learn Again
```

The objective is NOT a generic analytics dashboard. The objective is an **actionable learner intelligence layer** that guides the learner's next action with transparent, explainable recommendations.

---

## 2. Architecture

Phase 6 sits above the existing platform layers without replacing any underlying subsystems:

```text
Phase 2 (Learning)          Phase 3 (Circuit Lab)      Phase 4 (Simulator)      Phase 5 (AI Tutor)
  Lessons & Quizzes             Canonical Gates          Statevector Result        Chat Interactions
         │                             │                          │                        │
         └─────────────────────────────┼──────────────────────────┴────────────────────────┘
                                       │
                                       ▼
                            LEARNING EVENT SYSTEM
                                       │
                                       ▼
                              LEARNER MODEL
                     ┌─────────────────┼─────────────────┐
                     ▼                 ▼                 ▼
             Topic Mastery     Weakness/Strength     Activity Timeline
                     │                 │                 │
                     └─────────────────┼─────────────────┘
                                       ▼
                           RECOMMENDATION ENGINE
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             Adaptive Dashboard               Phase 5 AI Tutor Context
                      │                                 │
                      └────────────────┬────────────────┘
                                       ▼
                                    LEARNER
```

---

## 3. Learning Event System

The platform captures high-signal learning events from all functional areas. Low-signal UI interactions (such as hover, mousemove, or panel toggling) are excluded.

### Database Persistence:
Events are persisted in SQLite via `LearningEventModel` in `backend/app/db/models/adaptive.py`:
* `id`: UUID string primary key
* `user_id`: ForeignKey to `users.id` (indexed, cascading delete)
* `event_type`: Categorical string (indexed)
* `topic_id`: Canonical curriculum topic identifier (indexed)
* `lesson_id`: Associated lesson identifier (indexed)
* `concept_id`: Optional fine-grained sub-concept
* `metadata_json`: Structured payload (e.g. `qubits`, `shots`, `is_correct`, `hint_level`)
* `timestamp`: UTC datetime with timezone

---

## 4. Event Types

Canonical event types defined in `app.schemas.adaptive.LearningEventType`:

| Event Type | Source | Trigger Condition |
| :--- | :--- | :--- |
| `lesson_started` | Phase 2 Learning | Student begins reading a lesson |
| `lesson_completed` | Phase 2 Learning | Student marks lesson complete and earns XP |
| `topic_viewed` | Phase 2 Learning | Student opens a specific topic syllabus |
| `assessment_started` | Phase 2 Assessment | Student opens a quiz question |
| `assessment_completed` | Phase 2 Assessment | Student completes an assessment set |
| `question_answered` | Phase 2 Assessment | Student submits answer (records `is_correct`, `score`) |
| `circuit_created` | Phase 3 Circuit Lab | Student initializes a new circuit |
| `circuit_modified` | Phase 3 Circuit Lab | Student adds or modifies gates on canvas |
| `circuit_simulated` | Phase 4 Simulator | Student runs classical statevector simulation |
| `tutor_question` | Phase 5 AI Tutor | Student submits query to AI Tutor |
| `tutor_hint` | Phase 5 AI Tutor | Student requests progressive hint (levels 1–3) |
| `tutor_explanation` | Phase 5 AI Tutor | Student requests pedagogical explanation |
| `tutor_analysis` | Phase 5 AI Tutor | Student requests bug/misconception analysis |
| `practice_completed` | Quantum Practice | Student completes interactive lab exercise |

---

## 5. Learner Model

The learner model represents the authenticated learner's complete intelligence profile:

```typescript
type LearnerDashboardData = {
  user_id: string;
  display_name: string;
  overall_progress: number;
  total_xp: number;
  learning_streak_days: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  active_difficulty: "beginner" | "intermediate" | "advanced";
  topic_mastery: TopicMastery[];
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  recent_activity: LearningActivity[];
};
```

---

## 6. Mastery Model

Mastery is represented on a per-topic basis for all 20 canonical curriculum topics:

```typescript
type TopicMastery = {
  topic_id: string;
  topic_title: string;
  module_title?: string;
  score: number; // 0.0 to 100.0%
  confidence: number; // 0.0 to 1.0
  attempts: number;
  correct_attempts: number;
  level: "Not Started" | "Beginning" | "Developing" | "Proficient" | "Strong";
  last_activity_at?: string | null;
};
```

Mastery thresholds (centralized in `MASTERY_THRESHOLDS`):
* `0.0 – 24.9%`: **Not Started**
* `25.0 – 49.9%`: **Beginning**
* `50.0 – 69.9%`: **Developing**
* `70.0 – 84.9%`: **Proficient**
* `85.0 – 100.0%`: **Strong**

---

## 7. Explainable Mastery Formula

To avoid black-box ML opacity, the platform implements an explainable multi-signal formula:

$$
\text{Mastery Score} = \sum (w_i \times S_i)
$$

Where weights $w_i$ are centralized in `MASTERY_WEIGHTS`:

1. **Assessment Accuracy ($w = 0.40$):**
   $$\text{Accuracy} = \frac{\text{Correct Attempts}}{\text{Total Attempts}} \times 100$$
2. **Lesson Completion ($w = 0.25$):**
   $100\%$ if completed, $40\%$ if started, $0\%$ if unvisited.
3. **Circuit & Simulation Activity ($w = 0.15$):**
   Interactive simulations matching topic operations: $\min(100.0, \text{Simulations} \times 35.0)$.
4. **Practice & Tutor Engagement ($w = 0.10$):**
   Proactive inquiry reward: $\min(100.0, \text{Tutor Interactions} \times 20.0 + \text{Practice} \times 40.0)$. (Capped if $>3$ hints requested without correct answers).
5. **Recency Bonus ($w = 0.10$):**
   * $\le 3$ days: $100\%$
   * $\le 14$ days: $80\%$
   * $\le 30$ days: $50\%$
   * $> 30$ days: $25\%$

*Note on cold-start (no assessments yet):* When no assessment data exists, weights are re-normalized across coursework, simulation, and recency ($45\% / 25\% / 15\% / 15\%$).

---

## 8. Confidence Model

Confidence quantifies the empirical volume of evidence supporting the mastery score:

$$\text{Evidence Points} = \text{Attempts} + \text{Lesson Status} + \text{Simulations} + \text{Tutor Interactions}$$
$$\text{Confidence} = \min\left(1.0, \frac{\text{Evidence Points}}{5.0}\right)$$

* 1 attempt $\implies 0.20$ (Low)
* 3 attempts $\implies 0.60$ (Medium)
* $\ge 5$ attempts $\implies 1.00$ (High)

---

## 9. Weak-Topic & Strength Detection

### Weak-Topic Criteria (`identify_weak_topics`):
A topic is flagged as weak if:
1. $\text{Attempts} \ge 2$ AND ($\text{Score} < 50.0\%$ OR $\text{Accuracy} < 50\%$)
2. OR $\ge 3$ tutor hints requested on the topic with $\text{Score} < 60.0\%$

### Strength Criteria (`identify_strengths`):
A topic is recognized as strong if:
* $\text{Score} \ge 70.0\%$ AND $\text{Confidence} \ge 0.40$

---

## 10. Recommendation Engine

The recommendation engine synthesizes topic masteries, weak areas, incomplete lessons, and prerequisite dependencies to generate 3–5 diverse, prioritized recommendations.

### Diversity of Action Types:
1. `continue_learning`: Unfinished sequential syllabus lesson.
2. `review_lesson`: Re-visiting foundational concepts for detected weak topics.
3. `build_circuit`: Interactive Quantum Lab construction for newly learned gates.
4. `run_simulation`: Executing statevector simulation on newly built circuits.
5. `attempt_assessment`: Validating conceptual knowledge through quiz challenges.
6. `ask_tutor`: Targeted Socratic dialogue for challenging concepts.

---

## 11. Prerequisite Awareness & Adaptive Difficulty

### Prerequisite Graph:
The curriculum knowledge graph in `app/services/adaptive/curriculum_topics.py` defines prerequisite requirements:
* `qubits` $\to$ `superposition` $\to$ `measurement`
* `pauli_gates` + `bloch_sphere` $\to$ `hadamard_gate`
* `multi_qubit_systems` + `pauli_gates` $\to$ `cnot_gate`
* `cnot_gate` + `hadamard_gate` $\to$ `entanglement`
* `deutsch_algorithm` + `entanglement` $\to$ `grovers_algorithm`

If a learner exhibits weakness in an advanced concept (e.g. `entanglement`), the recommendation engine evaluates prerequisites (`cnot_gate`, `hadamard_gate`). If a prerequisite is weak, the engine recommends reviewing the foundational prerequisite *before* attempting the advanced topic.

### Adaptive Difficulty:
* **Beginner:** Default starting level for new learners and scores $< 50\%$.
* **Intermediate:** $\ge 4$ completed lessons and average mastery $\ge 50\%$.
* **Advanced:** $\ge 12$ completed lessons and average mastery $\ge 75\%$.

---

## 12. Adaptive Learner Dashboard

Implemented in `frontend/src/features/dashboard/DashboardPage.tsx`:
* **Metric Cards:** Real XP, Verified Learning Streak, Completed Lessons count, Overall Syllabus Progress.
* **Targeted Remediation Callout:** Visible when weak areas exist, showing specific topics needing reinforcement.
* **Personalized Recommendations Grid:** Cards with priority ranking, action type badge, transparent reasoning ("Why this?"), and direct CTA link.
* **Verifiable Topic Mastery:** Interactive list with color-coded mastery bars, badges (Not Started, Beginning, Developing, Proficient, Strong), and evidence counts. Filterable by All, Active, and Weak areas.
* **Activity Timeline:** Real-time chronological audit trail of completed lessons, circuit simulations, tutor interactions, and quiz attempts.
* **Course Syllabus Modules:** Real module completion percentages.

---

## 13. Phase 5 AI Tutor Integration

The Phase 5 AI Tutor receives Phase 6 learner context directly through `TutorRequest.learner_context` (`LearnerContextSchema`):
```text
TutorRequest
  ├── mode: "explain" | "hint" | "ask" | ...
  ├── message: "..."
  ├── circuit_context: { ... }
  ├── simulation_context: { ... }
  └── learner_context:
        ├── overall_progress: 35.0
        ├── weak_topics: ["superposition"]
        ├── strengths: ["qubits"]
        └── recommended_next: [ ... ]
```

When an inquiry is processed:
1. `ContextBuilder` appends the learner intelligence profile and pedagogical directives into the prompt.
2. The tutor adapts its tone and depth:
   * If weak in superposition: provides intuitive, analogy-based explanations.
   * If strong in single-qubit gates: builds directly on established knowledge for multi-qubit concepts.
3. Metadata confirms: `context_used.learner_context_applied = true`.
4. In the UI, `TutorPanel.tsx` displays an **Adaptive Grounding** badge indicating personalized response delivery.

---

## 14. Data Flow

```text
[Learner Action] (Lesson complete / Circuit simulate / Tutor query / Quiz submit)
       │
       ▼
[Backend Event Service] (Validates & records LearningEventModel in SQLite)
       │
       ▼
[Mastery Engine] (Recalculates deterministic topic mastery & confidence)
       │
       ▼
[Recommendation Engine] (Evaluates prerequisites, weak areas & unfinished lessons)
       │
       ├───► [Learner Dashboard API] (/api/v1/adaptive/dashboard)
       │           │
       │           ▼
       │     [Frontend React Dashboard]
       │
       └───► [AI Tutor Query API] (/api/v1/tutor/query)
                   │
                   ▼
             [Personalized Tutor Advice]
```

---

## 15. Security & Isolation

* **User Data Isolation:** All `/api/v1/adaptive/*` endpoints require authentication via JWT Bearer token (`get_current_user`). Queries are strictly filtered by `user_id`. User A cannot access User B's events, mastery, or recommendations.
* **Server-Side Verification:** Mastery scores and recommendations cannot be client-injected; they are calculated deterministically on the server.
* **Input Validation:** Pydantic schemas enforce type safety, bounds (e.g. $0 \le \text{shots} \le 8192$), and length limits.

---

## 16. Privacy & Data Minimization

* Only learning-relevant actions (lessons, circuits, simulations, quizzes, tutor questions) are stored.
* No passwords, session secrets, or private personal data are logged in event metadata.
* AI Tutor context is anonymized: only learning metrics (progress percentage, topic IDs, strengths, weaknesses) are passed to the AI provider.

---

## 17. Testing & Verification

Comprehensive automated test coverage:
* `backend/tests/test_adaptive.py`:
  * `test_empty_new_learner_dashboard_has_no_fake_mastery`
  * `test_record_learning_event_and_enrichment`
  * `test_deterministic_topic_mastery_formula`
  * `test_weak_topic_detection_and_remediation_recommendation`
  * `test_user_data_isolation`
  * `test_ai_tutor_integration_with_learner_context`
  * `test_simulation_event_tracking`
* `backend/tests/test_e2e_acceptance.py`:
  * `test_section_81_full_e2e_flow` (Full 12-step Section 81 lifecycle)
* **Total Project Tests:** 70 passed in 7.51 seconds (`pytest backend/tests/ -v`).
* **Frontend Production Build:** Successful in 1.37 seconds (`npm run build`).

---

## 18. MVP Limitations

* Mastery updates are computed synchronously upon event ingestion. For large-scale production deployments ($>100\text{k}$ concurrent users), background task workers (e.g. Celery / Redis Streams) can be adopted.
* Spaced repetition intervals currently use fixed recency windows (3, 14, 30 days) rather than SM-2 algorithmic scheduling.

---

## 19. Future Extensions

* Machine-learning topic mastery estimation (Bayesian Knowledge Tracing / IRT).
* Dynamic spaced-repetition flashcards and interactive practice prompts.
* Automated circuit bug identification with targeted remediation challenges.
* Multi-course adaptive roadmaps beyond the introductory track.

---

## 20. Phase 7 Handoff

Phase 7 consumers can cleanly integrate with the Phase 6 layer via:
* **API Endpoints:**
  * `POST /api/v1/adaptive/events`: Ingest custom learning events
  * `GET /api/v1/adaptive/dashboard`: Complete learner intelligence snapshot
  * `GET /api/v1/adaptive/mastery`: Detailed topic mastery scores
  * `GET /api/v1/adaptive/recommendations`: Prioritized personalized next actions
  * `POST /api/v1/adaptive/assessment`: Submit assessment questions with automatic mastery updates
  * `GET /api/v1/adaptive/context`: Lightweight context payload for AI agents
* **Key Schemas:** `LearningEvent`, `TopicMastery`, `Recommendation`, `LearnerContext`, `LearnerDashboardData` exported in `frontend/src/types/adaptive.ts` and `backend/app/schemas/adaptive.py`.
