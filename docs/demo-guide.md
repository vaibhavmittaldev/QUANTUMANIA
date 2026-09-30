# QUANTUMANIA — Official SIH 2026 Live Demonstration Guide

## 1. Demonstration Overview
This guide provides the step-by-step walkthrough for demonstrating **QUANTUMANIA** to Smart India Hackathon (SIH 2026) judges and evaluators.
The demonstration tells a cohesive educational story:

> **Problem:** Quantum computing is notoriously abstract, and students struggle to connect quantum mechanics theory with practical experimentation.  
> **Solution:** QUANTUMANIA unites structured theory, interactive circuit building, real classical simulation, grounded AI tutoring, and adaptive intelligence into one seamless platform.

---

## 2. Evaluation Setup & Quick Start

### Quick Access
- **Frontend Application:** `http://localhost:3000` (or `http://127.0.0.1:3000`)
- **Backend API Docs:** `http://localhost:8000/docs` (FastAPI Swagger UI)
- **Official Demo Account:**
  - **Email:** `demo@quantumania.org`
  - **Password:** `DemoPass123!`
  - **1-Click Action:** Click the green **"Quick Demo Sign-In (Evaluator Mode)"** button on the `/login` screen.

---

## 3. Step-by-Step SIH Demonstration Script (5–7 Minutes)

### Step 1: Authentication & Evaluator Login
- **Screen:** `http://localhost:3000/login`
- **Action:** Point out the sleek quantum obsidian interface. Click **"Quick Demo Sign-In (Evaluator Mode)"**.
- **Talking Point:** *"To enable instant, zero-friction evaluation, the platform includes a pre-seeded SIH Demo Account with authentic historical learning progress, simulated circuits, and adaptive profile data."*

---

### Step 2: Central Learner Dashboard
- **Screen:** `/app/dashboard`
- **Action:** Show the Welcome banner ("Welcome back, Quantum Explorer"), 3-day active streak, 240 XP, and 10% curriculum completion.
- **Talking Point:** *"The dashboard acts as the central command center for the student. Notice how the metrics reflect real student progress. The system displays personalized recommendations driven by our adaptive intelligence engine."*

---

### Step 3: Adaptive Recommendations & Weak Area Focus
- **Screen:** `/app/dashboard`
- **Action:** Point to the **"Targeted Remediation Focus"** card (alerting that CNOT / Entanglement needs review) and the **"Personalized Recommendations"** cards.
- **Talking Point:** *"QUANTUMANIA doesn't just present a static syllabus. It analyzes quiz accuracy, simulation attempts, and tutor questions to identify weak areas. Here, the system detected a struggle with the CNOT truth table and recommends a targeted review."*

---

### Step 4: Structured Curriculum & Theory
- **Screen:** `/app/learn` $\to$ Click **"Module 1: Foundations"** $\to$ Open **"Lesson 3: The Superposition Principle"**
- **Action:** Scroll through the structured lesson content: Dirac bra-ket equations, visual wave interference diagrams, and measurable learning objectives.
- **Talking Point:** *"Students first build conceptual intuition through 20 structured lessons across 5 comprehensive modules, from foundations to near-term noise and quantum error mitigation."*

---

### Step 5: Seamless Bridge to Quantum Lab
- **Screen:** Bottom of Lesson 3
- **Action:** Click the contextual CTA button: **"Open in Quantum Lab"** (or use the sidebar to open `/app/quantum-lab?template=superposition`).
- **Talking Point:** *"Rather than switching tools, the curriculum links directly into our Quantum Lab with the relevant starter circuit pre-loaded."*

---

### Step 6: Visual Quantum Circuit Builder
- **Screen:** `/app/quantum-lab`
- **Action:** Walk through the 3-panel workspace:
  1. **Gate Palette:** $H, X, Y, Z, S, T, CNOT, SWAP, Measure$.
  2. **Timeline Grid:** Drag-and-drop circuit canvas with real-time gate placement and collision prevention.
  3. **Circuit Inspector:** Real-time depth calculation, allocated qubits, and canonical JSON export.
- **Talking Point:** *"Our circuit builder enforces quantum mechanics constraints: gates cannot collide at the same step on the same wire, and multi-qubit gates enforce distinct control and target qubits."*

---

### Step 7: Quantum Statevector Simulator Execution
- **Screen:** `/app/quantum-lab`
- **Action:** Click **"Simulate Circuit"** (1024 shots).
- **Talking Point:** *"Watch how fast the simulation runs. In under 15 milliseconds, our classical statevector engine computes the exact complex probability amplitudes and samples 1024 measurement shots."*
- **Observe Results:**
  - Basis states: $|0\rangle \to 50\%$, $|1\rangle \to 50\%$.
  - Measurement Histogram: Approximately 512 counts for '0' and 512 counts for '1'.
  - Bloch Sphere Projection: Vector pointing along the $+X$ axis at $[1, 0, 0]$.

---

### Step 8: Multi-Qubit Entanglement (Bell State)
- **Screen:** Template dropdown on `/app/quantum-lab`
- **Action:** Select **"Bell State |Φ+⟩ (EPR Pair)"** and click **"Simulate Circuit"**.
- **Observe Results:**
  - Basis states: $|00\rangle \to 50\%$, $|11\rangle \to 50\%$, with $|01\rangle = 0\%$ and $|10\rangle = 0\%$.
- **Talking Point:** *"Notice the classical correlation: measuring qubit 0 as 0 guarantees qubit 1 is 0, demonstrating quantum entanglement."*

---

### Step 9: Context-Aware AI Quantum Tutor
- **Screen:** Right drawer on `/app/quantum-lab`
- **Action:** Click the quick prompt **"Explain Simulation"** or type: *"Why are states |01⟩ and |10⟩ never observed in this Bell state?"*
- **Talking Point:** *"This is where our AI Tutor shines. Most AI models hallucinate quantum probabilities. Ours is strictly grounded in the verified simulator state. It inspects the matrix output and explains that constructive interference cancels out the $|01\rangle$ and $|10\rangle$ components."*

---

### Step 10: Practice Arena & Live Knowledge Checks
- **Screen:** Navigate to `/app/practice` via sidebar
- **Action:**
  1. Show the **"Interactive Circuit Challenges"** (e.g. Superposition Generator, Bell State Entangler).
  2. Click the **"Concept Knowledge Checks"** tab.
  3. Answer Question 2 (CNOT operation on state $|11\rangle \to |10\rangle$) and click **"Verify Answer"**.
- **Talking Point:** *"The Practice Arena provides deliberate practice. When the student answers, immediate pedagogical feedback is provided, XP is awarded, and a learning event is dispatched to our adaptive engine."*

---

### Step 11: Learning Analytics & Explainable Mastery
- **Screen:** Navigate to `/app/progress` via sidebar
- **Action:**
  1. Show the **KPI Cards:** Overall progress, XP, streak, topics mastered.
  2. Show the **Topic Mastery Matrix:** Filter by 'Strong', 'Proficient', or 'Developing'.
  3. Show the **Recent Learning Activity Audit:** Highlight the recorded quiz attempt and simulation runs.
- **Talking Point:** *"Our mastery engine is 100% transparent and explainable. No black-box scores. Mastery is mathematically calculated from: Assessment (40%), Lesson Completion (25%), Simulation Activity (15%), Practice Engagement (10%), and Recency (10%)."*

---

## 4. Key Questions & Answers for Judges

### Q1: Is the quantum simulator running a real simulation or hardcoded mock data?
> **Answer:** It is a real classical quantum simulator. The backend computes $2^n$ complex statevectors using Kronecker matrix tensor products and unitary operator multiplication, then samples measurement distributions using pseudo-random shots. You can test any arbitrary combination of $H, X, Y, Z, S, T, CNOT$ gates and observe the exact physical probabilities.

### Q2: How does the AI Tutor avoid hallucinations?
> **Answer:** Through strict grounded context injection. The tutor prompt builder takes the active circuit JSON, verified simulation probabilities, dominant basis states, and current lesson objectives, and feeds them into the system prompt. If a user asks about simulation results before running the simulator, the AI explicitly alerts them to simulate first.

### Q3: How does the adaptive engine adapt to student needs?
> **Answer:** The system listens to unified `LearningEvents` across all activities. When accuracy falls below 60% or multiple hints are required on a topic, the topic is flagged as a growth area, and the recommendation engine prioritizes remediation over advanced modules.

### Q4: Can this scale to real quantum hardware (e.g. IBM Quantum)?
> **Answer:** Yes! Our circuit representation is canonical and matches the OpenQASM schema structure. The architecture includes a clean separation between the circuit model and the simulator engine, allowing an IBM Qiskit Runtime backend to be plugged in with zero frontend changes.
