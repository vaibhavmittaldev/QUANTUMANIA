# QUANTUMANIA - Backend Services Directory

This directory is designated for the backend API and domain services layer.

## Architecture & Modular Boundaries

The backend will be scaffolded in subsequent phases following a modular architecture:

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py          # Phase 1: Authentication & User routes (Owner: Vaibhav)
│   │   │   │   ├── learning.py      # Phase 2: Courses & Lesson routes (Owner: Vaibhav)
│   │   │   │   ├── quantum.py       # Phase 3 & 4: Circuits & Simulation routes (Owner: Tanishq)
│   │   │   │   ├── ai.py            # Phase 5: Grounded AI Tutor routes (Owner: Tanishq)
│   │   │   │   ├── assessment.py    # Phase 6: Quizzes & Challenge routes (Owner: Vaibhav)
│   │   │   │   └── progress.py      # Phase 6: Progress & Analytics routes (Owner: Vaibhav)
│   │   │   └── router.py            # Combined API router
│   ├── core/
│   │   ├── config.py                # Environment configuration & settings
│   │   ├── security.py              # JWT tokens, password hashing, auth guards
│   │   └── exceptions.py            # Centralized exception handlers & error schemas
│   ├── db/
│   │   ├── base.py                  # Database session & base model
│   │   └── models/                  # SQLAlchemy / ORM models matching docs/DATABASE.md
│   ├── schemas/                     # Pydantic schemas adhering to docs/API_CONTRACT.md and docs/QUANTUM_SCHEMA.md
│   │   ├── auth.py
│   │   ├── circuit.py               # Canonical quantum circuit schema
│   │   ├── simulation.py            # Canonical simulation result schema
│   │   ├── ai.py
│   │   └── assessment.py
│   └── services/
│       ├── auth_service.py          # User management & credentials
│       ├── learning_service.py      # Course & progress logic
│       ├── quantum_engine/          # Phase 4: Quantum statevector simulator (Owner: Tanishq)
│       │   ├── gates.py
│       │   ├── circuit_validator.py
│       │   └── simulator.py
│       ├── ai_tutor/                # Phase 5: Grounded prompt builder & LLM client (Owner: Tanishq)
│       │   ├── context_builder.py
│       │   └── prompt_templates.py
│       └── assessment_service.py    # Automated circuit evaluation & grading
├── tests/
├── requirements.txt
└── pyproject.toml
```

> **Note for Developers**:
> - All endpoints must conform strictly to `docs/API_CONTRACT.md`.
> - All quantum circuit data must validate against `docs/QUANTUM_SCHEMA.md`.
> - Database models must conform to `docs/DATABASE.md`.
