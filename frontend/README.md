# QUANTUMANIA - Frontend Application Directory

This directory is designated for the frontend application layer.

## Architecture & Modular Boundaries

The frontend will be scaffolded in subsequent phases following modern modular standards:

```
frontend/
├── src/
│   ├── assets/              # Static media, icons, logo
│   ├── components/          # Shared design-system components (buttons, cards, modals)
│   │   ├── ui/              # Atom/molecule components (see docs/UI_SYSTEM.md)
│   │   └── layout/          # Header, Sidebar, Navigation
│   ├── features/            # Feature modules divided by developer ownership
│   │   ├── auth/            # Phase 1: Authentication views & forms (Owner: Vaibhav)
│   │   ├── learning/        # Phase 2: Lesson viewer & curriculum navigation (Owner: Vaibhav)
│   │   ├── circuit-builder/ # Phase 3: Interactive drag-and-drop circuit canvas (Owner: Tanishq)
│   │   ├── simulation/      # Phase 4: Statevector, Bloch sphere, histogram visualizations (Owner: Tanishq)
│   │   ├── ai-tutor/        # Phase 5: Grounded interactive quantum chat assistant (Owner: Tanishq)
│   │   └── assessment/      # Phase 6: Quizzes, code challenges, progress dashboard (Owner: Vaibhav)
│   ├── hooks/               # Custom reusable React hooks
│   ├── services/            # API client layer adhering to docs/API_CONTRACT.md
│   ├── types/               # TypeScript interfaces (canonical circuit types from docs/QUANTUM_SCHEMA.md)
│   ├── utils/               # Formatting, math, and utility helpers
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
└── tsconfig.json
```

> **Note for Developers**:
> - Vaibhav owns `features/auth/`, `features/learning/`, `features/assessment/`, and root layout/app shell.
> - Tanishq owns `features/circuit-builder/`, `features/simulation/`, and `features/ai-tutor/`.
> - Do not modify cross-domain features without prior alignment.
