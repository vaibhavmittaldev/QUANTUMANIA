# API Contract Specification

## 1. Overview & General Standards

This document establishes the official REST API specification for **QUANTUMANIA**. All endpoints operate over HTTP/HTTPS, accept and return JSON payloads, and adhere to a unified response envelope.

- **Base URL Prefix**: `/api/v1`
- **Content-Type**: `application/json; charset=utf-8`
- **Authentication Header**: `Authorization: Bearer <JWT_ACCESS_TOKEN>` (for protected endpoints)

---

## 2. Standard Response Envelopes

Every API endpoint MUST return one of the following two standard formats:

### 2.1. Success Envelope (`HTTP 200 / 201`)
```json
{
  "success": true,
  "data": {
    /* Payload object or array */
  }
}
```

### 2.2. Error Envelope (`HTTP 400 / 401 / 403 / 404 / 422 / 500`)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "The username or password provided is incorrect.",
    "details": null
  }
}
```

Standard Error Codes:
- `UNAUTHORIZED`: Token missing or expired.
- `FORBIDDEN`: Insufficient permissions.
- `NOT_FOUND`: Resource with given ID does not exist.
- `VALIDATION_ERROR`: Request body failed field validation.
- `INVALID_CIRCUIT`: Circuit syntax or quantum rule violated.
- `SIMULATION_FAILED`: Math engine computation error.
- `AI_SERVICE_UNAVAILABLE`: LLM provider rate limit or outage.
- `INTERNAL_SERVER_ERROR`: Unhandled exception.

---

## 3. Endpoints Matrix

### 3.1. Authentication (Owner: Vaibhav)

#### `POST /auth/register`
* **Access**: Public
* **Description**: Registers a new learner account.
* **Request Body**:
  ```json
  {
    "email": "learner@example.com",
    "username": "quantum_enthusiast",
    "password": "SecurePassword123!"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "user_id": "usr_9b1deb4d3b7d489",
      "email": "learner@example.com",
      "username": "quantum_enthusiast",
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
  }
  ```

#### `POST /auth/login`
* **Access**: Public
* **Description**: Authenticates user credentials and returns JWT token.
* **Request Body**:
  ```json
  {
    "email": "learner@example.com",
    "password": "SecurePassword123!"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user_id": "usr_9b1deb4d3b7d489",
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
  }
  ```

#### `GET /me`
* **Access**: Authenticated
* **Description**: Returns profile and current user metadata.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user_id": "usr_9b1deb4d3b7d489",
      "email": "learner@example.com",
      "username": "quantum_enthusiast",
      "experience_level": "beginner",
      "points": 140,
      "current_streak_days": 3,
      "created_at": "2026-09-29T10:00:00Z"
    }
  }
  ```

---

### 3.2. Learning & Curriculum (Owner: Vaibhav)

#### `GET /courses`
* **Access**: Public / Authenticated
* **Description**: List all available quantum curriculum courses with module outlines.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "crs_foundations_01",
        "title": "Quantum Computing Foundations",
        "slug": "quantum-foundations",
        "description": "Learn qubits, superposition, entanglement, and fundamental quantum logic gates.",
        "difficulty": "beginner",
        "estimated_hours": 6,
        "total_modules": 4,
        "total_lessons": 16,
        "progress_percent": 25.0
      }
    ]
  }
  ```

#### `GET /courses/{course_id}`
* **Access**: Public / Authenticated
* **Description**: Get course details, syllabus modules, and lesson tree.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "crs_foundations_01",
      "title": "Quantum Computing Foundations",
      "modules": [
        {
          "id": "mod_superposition",
          "title": "Module 1: Superposition & Single Qubits",
          "order": 1,
          "lessons": [
            {
              "id": "les_bloch_hadamard",
              "title": "The Hadamard Gate and The Bloch Sphere",
              "order": 1,
              "is_completed": true,
              "has_interactive_circuit": true
            }
          ]
        }
      ]
    }
  }
  ```

#### `GET /lessons/{lesson_id}`
* **Access**: Authenticated
* **Description**: Retrieve full lesson content, markdown content, embedded starting circuit, and quiz ID.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "les_bloch_hadamard",
      "title": "The Hadamard Gate and The Bloch Sphere",
      "course_id": "crs_foundations_01",
      "module_id": "mod_superposition",
      "content_markdown": "# The Hadamard Gate\nApplying H to |0> yields (|0> + |1>)/sqrt(2)...",
      "initial_circuit": {
        "schema_version": "1.0.0",
        "qubits": 1,
        "classical_bits": 1,
        "gates": [{ "type": "H", "targets": [0] }],
        "measurements": [{ "qubit": 0, "classical_bit": 0 }]
      },
      "quiz_id": "qz_hadamard_check",
      "challenge_id": "ch_hadamard_superposition",
      "is_completed": false
    }
  }
  ```

#### `POST /lessons/{lesson_id}/complete`
* **Access**: Authenticated
* **Description**: Marks a lesson as finished and updates user progress.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "lesson_id": "les_bloch_hadamard",
      "is_completed": true,
      "xp_awarded": 25,
      "next_lesson_id": "les_pauli_gates"
    }
  }
  ```

---

### 3.3. Quantum Engine & Circuits (Owner: Tanishq)

#### `POST /simulate`
* **Access**: Authenticated / Public Sandbox
* **Description**: Executes canonical quantum circuit on mathematical simulator.
* **Request Body**:
  ```json
  {
    "circuit": {
      "schema_version": "1.0.0",
      "qubits": 2,
      "classical_bits": 2,
      "gates": [
        { "type": "H", "targets": [0] },
        { "type": "CNOT", "control": 0, "target": 1 }
      ],
      "measurements": [
        { "qubit": 0, "classical_bit": 0 },
        { "qubit": 1, "classical_bit": 1 }
      ]
    },
    "shots": 1024
  }
  ```
* **Success Response (200 OK)**: Adheres strictly to `docs/QUANTUM_SCHEMA.md`:
  ```json
  {
    "success": true,
    "data": {
      "success": true,
      "shots": 1024,
      "counts": { "00": 514, "11": 510 },
      "probabilities": { "00": 0.50195, "01": 0.0, "10": 0.0, "11": 0.49805 },
      "statevector": [
        { "basis": "00", "real": 0.70710678, "imag": 0.0, "magnitude": 0.5, "phase_rad": 0.0 },
        { "basis": "01", "real": 0.0, "imag": 0.0, "magnitude": 0.0, "phase_rad": 0.0 },
        { "basis": "10", "real": 0.0, "imag": 0.0, "magnitude": 0.0, "phase_rad": 0.0 },
        { "basis": "11", "real": 0.70710678, "imag": 0.0, "magnitude": 0.5, "phase_rad": 0.0 }
      ],
      "bloch_vectors": [
        { "qubit": 0, "x": 0.0, "y": 0.0, "z": 0.0 },
        { "qubit": 1, "x": 0.0, "y": 0.0, "z": 0.0 }
      ],
      "execution_time_ms": 3.12
    }
  }
  ```

#### `POST /circuits`
* **Access**: Authenticated
* **Description**: Saves a user-created circuit to their workbench.
* **Request Body**:
  ```json
  {
    "name": "My Custom Teleportation Circuit",
    "description": "Quantum teleportation protocol experiment",
    "circuit": {
      "schema_version": "1.0.0",
      "qubits": 3,
      "classical_bits": 2,
      "gates": [...]
    }
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "circuit_id": "cct_8849204820",
      "name": "My Custom Teleportation Circuit",
      "updated_at": "2026-09-29T11:00:00Z"
    }
  }
  ```

#### `GET /circuits/{circuit_id}`
* **Access**: Authenticated
* **Description**: Retrieves a saved circuit by ID.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "circuit_id": "cct_8849204820",
      "name": "My Custom Teleportation Circuit",
      "circuit": { ... }
    }
  }
  ```

#### `PUT /circuits/{circuit_id}`
* **Access**: Authenticated
* **Description**: Updates an existing circuit.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "circuit_id": "cct_8849204820",
      "updated_at": "2026-09-29T11:30:00Z"
    }
  }
  ```

---

### 3.4. Grounded AI Tutor (Owner: Tanishq)

#### `POST /ai/explain`
* **Access**: Authenticated
* **Description**: Explains the active circuit and its simulation behavior in educational terms.
* **Request Body**:
  ```json
  {
    "circuit": { ... },
    "simulation_result": { ... },
    "lesson_id": "les_bloch_hadamard",
    "query": "Why did the measurement collapse into only 00 and 11?"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "explanation": "Because of quantum entanglement created by the CNOT gate! When qubit 0 was placed into superposition by the Hadamard gate, and then used to control qubit 1, both qubits became correlated. Measuring qubit 0 immediately determines qubit 1.",
      "suggested_followups": [
        "What happens if I put another Hadamard on qubit 1?",
        "Can I measure only qubit 0?"
      ]
    }
  }
  ```

#### `POST /ai/debug`
* **Access**: Authenticated
* **Description**: Diagnose why a circuit is not matching a desired state or why an error occurred.
* **Request Body**:
  ```json
  {
    "circuit": { ... },
    "simulation_result": { ... },
    "expected_outcome": "Equal superposition of |00> and |01>"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "diagnosis": "Your Hadamard gate is currently targeting qubit 0 instead of qubit 1. Qubit 0 is being flipped while qubit 1 remains in state |0>.",
      "fix_suggestion": "Move the Hadamard gate from target [0] to target [1]."
    }
  }
  ```

#### `POST /ai/hint`
* **Access**: Authenticated
* **Description**: Provides a pedagogical nudge for an active challenge without solving it outright.
* **Request Body**:
  ```json
  {
    "challenge_id": "ch_bell_state",
    "current_circuit": { ... },
    "hint_level": 1
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "hint_level": 1,
      "hint": "Notice that an entangled state requires first putting one qubit into superposition before interacting them with a 2-qubit gate.",
      "remaining_hints": 2
    }
  }
  ```

#### `POST /ai/generate-code`
* **Access**: Authenticated
* **Description**: Exports the current circuit into Qiskit or Cirq Python code.
* **Request Body**:
  ```json
  {
    "circuit": { ... },
    "target_framework": "qiskit"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "framework": "qiskit",
      "code": "from qiskit import QuantumCircuit\n\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure([0, 1], [0, 1])\n"
    }
  }
  ```

---

### 3.5. Assessment & Challenges (Owner: Vaibhav)

#### `GET /quizzes/{quiz_id}`
* **Access**: Authenticated
* **Description**: Retrieves multiple-choice conceptual questions for a lesson.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "quiz_id": "qz_hadamard_check",
      "title": "Superposition Knowledge Check",
      "questions": [
        {
          "question_id": "q1",
          "prompt": "What is the result of applying a Hadamard gate to |0>?",
          "options": [
            { "id": "opt_a", "text": "|1>" },
            { "id": "opt_b", "text": "(|0> + |1>) / sqrt(2)" },
            { "id": "opt_c", "text": "(|0> - |1>) / sqrt(2)" },
            { "id": "opt_d", "text": "|0>" }
          ]
        }
      ]
    }
  }
  ```

#### `POST /quizzes/{quiz_id}/submit`
* **Access**: Authenticated
* **Description**: Submits quiz answers and returns score and detailed explanations.
* **Request Body**:
  ```json
  {
    "answers": {
      "q1": "opt_b"
    }
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "score": 100.0,
      "passed": true,
      "xp_earned": 50,
      "results": [
        {
          "question_id": "q1",
          "is_correct": true,
          "correct_option": "opt_b",
          "explanation": "H|0> produces equal amplitudes for |0> and |1>."
        }
      ]
    }
  }
  ```

#### `GET /challenges`
* **Access**: Authenticated
* **Description**: Lists all quantum algorithm challenges (e.g. Bell State, Superdense Coding, Deutsch Algorithm).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "challenge_id": "ch_bell_state",
        "title": "Construct Bell State |Phi+>",
        "difficulty": "medium",
        "description": "Construct a 2-qubit circuit that produces measurement outcomes '00' and '11' with equal 50% probability.",
        "max_qubits": 2,
        "is_completed": false
      }
    ]
  }
  ```

#### `POST /challenges/{challenge_id}/submit`
* **Access**: Authenticated
* **Description**: Evaluates submitted quantum circuit against challenge verification test cases.
* **Request Body**:
  ```json
  {
    "circuit": { ... }
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "challenge_id": "ch_bell_state",
      "passed": true,
      "fidelity": 1.0,
      "feedback": "Perfect! Your circuit successfully generated the entangled Bell state.",
      "score": 100,
      "xp_awarded": 75
    }
  }
  ```

---

### 3.6. Progress & Recommendations (Owner: Vaibhav)

#### `GET /progress`
* **Access**: Authenticated
* **Description**: Returns overall learning analytics, completed courses, badges, and streaks.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "total_xp": 450,
      "completed_lessons_count": 8,
      "completed_challenges_count": 3,
      "accuracy_percentage": 92.5,
      "achievements": [
        {
          "badge_id": "ach_first_entanglement",
          "title": "Spooky Action Master",
          "earned_at": "2026-09-29T10:30:00Z"
        }
      ]
    }
  }
  ```

#### `GET /recommendations`
* **Access**: Authenticated
* **Description**: Provides personalized next topics or remedial challenges based on user performance.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "next_recommended_lesson": {
        "lesson_id": "les_entanglement_deep_dive",
        "title": "Deep Dive into Quantum Entanglement",
        "reason": "You've successfully completed single-qubit superpositions!"
      },
      "practice_challenges": ["ch_superdense_coding"]
    }
  }
  ```
