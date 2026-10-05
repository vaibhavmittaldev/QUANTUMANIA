"""
QUANTUMANIA - Canonical Lab Problem Dataset
Structured practical quantum lab challenges mapped to curriculum lessons.
Progressive difficulty: Beginner -> Intermediate -> Advanced.
"""

from typing import List, Dict, Any

LAB_PROBLEMS_DATA: List[Dict[str, Any]] = [
    # --------------------------------------------------------------------------
    # LESSON 2: Bits vs Qubits (mod_foundations)
    # --------------------------------------------------------------------------
    {
        "id": "lab_bits_qubits_01",
        "lesson_id": "les_02_bits_vs_qubits",
        "topic_id": "qubits",
        "title": "Prepare the |1⟩ Excited State",
        "description": "Initialize a quantum register in |0⟩ and use the Pauli-X bit-flip gate to transition qubit q0 into the excited state |1⟩.",
        "objective": "Apply a Pauli-X gate to qubit q0, measure it, and observe 100% probability for classical outcome '1'.",
        "difficulty": "beginner",
        "instructions": [
            "Select qubit q0 on the canvas.",
            "Drag or click the Pauli-X gate from the Gate Toolbox onto q0 at step 0.",
            "Click 'Run Circuit' with 1024 shots.",
            "Verify the measurement distribution yields outcome |1⟩."
        ],
        "starter_circuit_json": {
            "schema_version": "1.0.0",
            "name": "Prepare |1>",
            "qubits": 1,
            "classical_bits": 1,
            "gates": [],
            "measurements": [{"qubit": 0, "classical_bit": 0}]
        },
        "template_id": None,
        "required_gates": ["X"],
        "validation_rules": {
            "min_qubits": 1,
            "required_gate_types": ["X"],
            "target_states": {"1": 1.0},
            "tolerance": 0.05
        },
        "hints": [
            "In Dirac notation, |0⟩ is the ground state and |1⟩ is the excited state.",
            "The Pauli-X gate acts as the quantum NOT operator: X|0⟩ = |1⟩.",
            "Place gate 'X' on wire q[0] and execute the simulation."
        ],
        "success_criteria": "The qubit is transformed from |0⟩ to |1⟩, producing 100% measurement probability for outcome '1'.",
        "explanation": "The Pauli-X gate represents a π-radian rotation around the X-axis of the Bloch sphere, flipping the state from the north pole |0⟩ to the south pole |1⟩.",
        "estimated_minutes": 5,
        "display_order": 1,
        "xp_reward": 40
    },
    {
        "id": "lab_bits_qubits_02",
        "lesson_id": "les_02_bits_vs_qubits",
        "topic_id": "qubits",
        "title": "Double Bit-Flip Reversibility",
        "description": "Demonstrate the unitary self-inverse property of quantum operations: applying X twice returns the qubit to |0⟩.",
        "objective": "Apply two consecutive X gates on q0 and observe recovery of the original |0⟩ ground state.",
        "difficulty": "beginner",
        "instructions": [
            "Place an X gate on q0 at step 0.",
            "Place a second X gate on q0 at step 1.",
            "Simulate the circuit and observe that X * X = I."
        ],
        "starter_circuit_json": None,
        "template_id": None,
        "required_gates": ["X"],
        "validation_rules": {
            "min_qubits": 1,
            "min_gate_count": 2,
            "required_gate_types": ["X"],
            "target_states": {"0": 1.0},
            "tolerance": 0.05
        },
        "hints": [
            "Quantum gates are reversible unitary matrices.",
            "Because X is Hermitian and unitary, X† = X and X² = I (identity).",
            "Place two X gates sequentially on q[0]."
        ],
        "success_criteria": "Applying X twice returns the state to |0⟩ with 100% fidelity.",
        "explanation": "Because X² = I, applying two bit-flips in succession perfectly restores the original quantum state, demonstrating Landauer-free reversible computation.",
        "estimated_minutes": 5,
        "display_order": 2,
        "xp_reward": 40
    },

    # --------------------------------------------------------------------------
    # LESSON 3: Superposition (mod_foundations)
    # --------------------------------------------------------------------------
    {
        "id": "lab_superposition_01",
        "lesson_id": "les_03_superposition",
        "topic_id": "superposition",
        "title": "Create a Superposition State",
        "description": "Use the Hadamard gate on q0 to create an equal superposition of |0⟩ and |1⟩. Run the circuit with 1024 shots and observe the measurement distribution.",
        "objective": "Apply H on q0 to transform |0⟩ into (|0⟩ + |1⟩)/√2, yielding an equal ~50/50 measurement distribution.",
        "difficulty": "beginner",
        "instructions": [
            "Select qubit q0 on the canvas.",
            "Place a Hadamard (H) gate on wire q0 at step 0.",
            "Add measurement on q0 to classical bit c0.",
            "Click 'Run Circuit' with 1024 shots.",
            "Observe that outcomes '0' and '1' both appear with approximately 50% probability."
        ],
        "starter_circuit_json": {
            "schema_version": "1.0.0",
            "name": "Superposition Starter",
            "qubits": 1,
            "classical_bits": 1,
            "gates": [],
            "measurements": [{"qubit": 0, "classical_bit": 0}]
        },
        "template_id": "superposition",
        "required_gates": ["H"],
        "validation_rules": {
            "min_qubits": 1,
            "required_gate_types": ["H"],
            "target_states": {"0": 0.50, "1": 0.50},
            "tolerance": 0.08  # Allows probabilistic simulation variation
        },
        "hints": [
            "The Hadamard gate creates an equal superposition of basis states.",
            "Matrix: H = (1/√2)[[1, 1], [1, -1]].",
            "Drag the 'H' gate from the Single Qubit section onto qubit wire q0."
        ],
        "success_criteria": "The circuit contains an H gate on q0, producing approximately 50% |0⟩ and 50% |1⟩ measurement frequencies.",
        "explanation": "Hadamard transforms the Z-basis state |0⟩ into the X-basis state |+⟩ = (|0⟩ + |1⟩)/√2. By the Born rule, P(0) = |1/√2|² = 0.5 and P(1) = |1/√2|² = 0.5.",
        "estimated_minutes": 8,
        "display_order": 1,
        "xp_reward": 50
    },
    {
        "id": "lab_superposition_02",
        "lesson_id": "les_03_superposition",
        "topic_id": "superposition",
        "title": "Superposition Interference (H → H)",
        "description": "Explore quantum interference by applying two Hadamard gates in sequence. Observe how constructive interference channels probability back to |0⟩.",
        "objective": "Apply H followed by H on q0 and explain why the final measurement deterministically returns |0⟩.",
        "difficulty": "intermediate",
        "instructions": [
            "Place an H gate on q0 at step 0.",
            "Place a second H gate on q0 at step 1.",
            "Simulate the circuit.",
            "Verify that outcome '0' has ~100% probability while '1' has 0%."
        ],
        "starter_circuit_json": None,
        "template_id": None,
        "required_gates": ["H"],
        "validation_rules": {
            "min_qubits": 1,
            "min_gate_count": 2,
            "required_gate_types": ["H"],
            "target_states": {"0": 1.0},
            "tolerance": 0.05
        },
        "hints": [
            "The first H gate creates equal superposition (|0⟩ + |1⟩)/√2.",
            "The second H gate maps |0⟩ -> (|0⟩+|1⟩)/√2 and |1⟩ -> (|0⟩-|1⟩)/√2.",
            "The |0⟩ amplitudes add constructively ((1/2)+(1/2) = 1), while the |1⟩ amplitudes cancel destructively ((1/2)-(1/2) = 0)."
        ],
        "success_criteria": "Applying H twice deterministically recovers |0⟩ with 100% probability.",
        "explanation": "This demonstrates quantum interference: amplitudes can be positive or negative, allowing destructive cancellation of unwanted computational paths.",
        "estimated_minutes": 10,
        "display_order": 2,
        "xp_reward": 60
    },

    # --------------------------------------------------------------------------
    # LESSON 4: Measurement and State Collapse (mod_foundations)
    # --------------------------------------------------------------------------
    {
        "id": "lab_measurement_01",
        "lesson_id": "les_04_measurement",
        "topic_id": "measurement",
        "title": "Projective Measurement & Born Rule Statistics",
        "description": "Construct a superposition circuit and analyze how finite shot sampling converges toward the theoretical Born rule probabilities.",
        "objective": "Configure 1024 simulation shots on a Hadamard circuit and inspect both empirical counts and exact statevector amplitudes.",
        "difficulty": "beginner",
        "instructions": [
            "Construct a single-qubit Hadamard circuit on q0.",
            "Ensure a measurement gate is mapped from q0 to classical bit c0.",
            "Execute simulation with 1024 shots.",
            "Switch to the 'Statevector Amplitudes' tab to compare exact probabilities with shot counts."
        ],
        "starter_circuit_json": None,
        "template_id": "superposition",
        "required_gates": ["H", "MEASURE"],
        "validation_rules": {
            "min_qubits": 1,
            "required_gate_types": ["H"],
            "target_states": {"0": 0.50, "1": 0.50},
            "tolerance": 0.08
        },
        "hints": [
            "Measurement converts quantum superposition into classical bits 0 or 1.",
            "Statevector mode calculates the exact analytical complex amplitudes α and β.",
            "Shot sampling simulates hardware stochastic outcomes with Poissonian variance ~ 1/√N."
        ],
        "success_criteria": "Measurement statistics and statevector tabs reflect unbiased projective collapse.",
        "explanation": "The Born rule dictates that P(x) = |⟨x|ψ⟩|². Sampling across 1024 shots reconstructs this probability distribution within standard statistical tolerances.",
        "estimated_minutes": 8,
        "display_order": 1,
        "xp_reward": 50
    },

    # --------------------------------------------------------------------------
    # LESSON 7: The Hadamard Gate (mod_states_gates)
    # --------------------------------------------------------------------------
    {
        "id": "lab_hadamard_01",
        "lesson_id": "les_07_hadamard_gate",
        "topic_id": "hadamard_gate",
        "title": "Prepare the Orthogonal |-⟩ Superposition",
        "description": "Initialize q0 in |1⟩ using an X gate, then apply Hadamard to prepare the orthogonal superposition state |-⟩ = (|0⟩ - |1⟩)/√2.",
        "objective": "Apply X followed by H on q0. Verify the statevector has a negative phase on basis state |1⟩.",
        "difficulty": "intermediate",
        "instructions": [
            "Place an X gate on q0 at step 0 to prepare |1⟩.",
            "Place an H gate on q0 at step 1.",
            "Run the circuit and inspect the Statevector tab.",
            "Notice that amplitude of |1⟩ is -0.7071 (negative real amplitude)."
        ],
        "starter_circuit_json": None,
        "template_id": None,
        "required_gates": ["X", "H"],
        "validation_rules": {
            "min_qubits": 1,
            "min_gate_count": 2,
            "required_gate_types": ["X", "H"],
            "target_states": {"0": 0.50, "1": 0.50},
            "expected_statevector_phases": {"1": -1.0},
            "tolerance": 0.08
        },
        "hints": [
            "H acting on |0⟩ yields |+⟩ = (|0⟩ + |1⟩)/√2.",
            "H acting on |1⟩ yields |-⟩ = (|0⟩ - |1⟩)/√2.",
            "First apply X to flip |0⟩ to |1⟩, then apply H."
        ],
        "success_criteria": "The circuit prepares |-⟩ with equal 50% probabilities and a negative relative phase on |1⟩.",
        "explanation": "While |+⟩ and |-⟩ have identical 50/50 measurement probabilities in the Z-basis, they are completely orthogonal in the Hilbert space (⟨+|-⟩ = 0) due to relative phase.",
        "estimated_minutes": 10,
        "display_order": 1,
        "xp_reward": 60
    },

    # --------------------------------------------------------------------------
    # LESSON 8: Pauli Gates (mod_states_gates)
    # --------------------------------------------------------------------------
    {
        "id": "lab_pauli_01",
        "lesson_id": "les_08_pauli_gates",
        "topic_id": "pauli_gates",
        "title": "Phase-Flip with Pauli-Z on Superposition",
        "description": "Prepare |+⟩ with an H gate, then apply the Pauli-Z gate. Observe how Z rotates relative phase without altering measurement probabilities.",
        "objective": "Construct H → Z on q0. Confirm that the measurement distribution remains 50/50 while the state transitions from |+⟩ to |-⟩.",
        "difficulty": "intermediate",
        "instructions": [
            "Place an H gate on q0 at step 0.",
            "Place a Z gate on q0 at step 1.",
            "Simulate the circuit.",
            "Inspect the Bloch sphere: observe the state vector pointing along the -X axis (| - ⟩)."
        ],
        "starter_circuit_json": None,
        "template_id": None,
        "required_gates": ["H", "Z"],
        "validation_rules": {
            "min_qubits": 1,
            "min_gate_count": 2,
            "required_gate_types": ["H", "Z"],
            "target_states": {"0": 0.50, "1": 0.50},
            "tolerance": 0.08
        },
        "hints": [
            "The Pauli-Z gate leaves |0⟩ unchanged and maps |1⟩ to -|1⟩.",
            "Z |+⟩ = Z ((|0⟩ + |1⟩)/√2) = (|0⟩ - |1⟩)/√2 = |-⟩.",
            "Combine H followed by Z on wire q0."
        ],
        "success_criteria": "Circuit executes H → Z, preserving equal 50/50 measurement distribution while flipping state phase.",
        "explanation": "Pauli-Z acts as a 180-degree rotation around the Z-axis of the Bloch sphere, flipping the vector from (+X, 0, 0) to (-X, 0, 0).",
        "estimated_minutes": 10,
        "display_order": 1,
        "xp_reward": 55
    },

    # --------------------------------------------------------------------------
    # LESSON 10: Controlled Operations (mod_multi_qubit)
    # --------------------------------------------------------------------------
    {
        "id": "lab_cnot_01",
        "lesson_id": "les_10_controlled_operations",
        "topic_id": "cnot_gate",
        "title": "Controlled-NOT Logic Verification",
        "description": "Prepare control qubit q0 in |1⟩ using X, and use q0 as the control of a CNOT targeting q1. Observe deterministic transition to |11⟩.",
        "objective": "Construct X(q0) → CNOT(control=q0, target=q1). Verify measurement outcome '11' with 100% probability.",
        "difficulty": "intermediate",
        "instructions": [
            "Place an X gate on q0 at step 0.",
            "Place a CNOT gate with control on q0 and target on q1 at step 1.",
            "Measure both qubits q0 and q1.",
            "Run simulation and verify outcome |11⟩."
        ],
        "starter_circuit_json": {
            "schema_version": "1.0.0",
            "name": "CNOT Verification Starter",
            "qubits": 2,
            "classical_bits": 2,
            "gates": [],
            "measurements": [
                {"qubit": 0, "classical_bit": 0},
                {"qubit": 1, "classical_bit": 1}
            ]
        },
        "template_id": None,
        "required_gates": ["X", "CNOT"],
        "validation_rules": {
            "min_qubits": 2,
            "required_gate_types": ["X", "CNOT"],
            "target_states": {"11": 1.0},
            "tolerance": 0.05
        },
        "hints": [
            "CNOT flips the target qubit if and only if the control qubit is in state |1⟩.",
            "Since q0 is initialized to |0⟩, applying X(q0) sets the control to |1⟩.",
            "Then CNOT(q0, q1) flips q1 from |0⟩ to |1⟩, resulting in composite state |11⟩."
        ],
        "success_criteria": "The circuit deterministically produces state |11⟩.",
        "explanation": "In computational basis notation, CNOT|10⟩ = |11⟩ because the control bit is 1, triggering the NOT flip on target qubit q1.",
        "estimated_minutes": 10,
        "display_order": 1,
        "xp_reward": 60
    },

    # --------------------------------------------------------------------------
    # LESSON 12: Creating Bell States (mod_multi_qubit)
    # --------------------------------------------------------------------------
    {
        "id": "lab_bell_state_01",
        "lesson_id": "les_12_bell_states",
        "topic_id": "bell_states",
        "title": "Create the Bell State |Φ+⟩",
        "description": "Construct the canonical maximally entangled Bell pair |Φ+⟩ = (|00⟩ + |11⟩)/√2 using Hadamard on q0 and CNOT from q0 to q1.",
        "objective": "Apply H(q0) followed by CNOT(q0, q1). Verify correlated 50% |00⟩ and 50% |11⟩ measurement outcomes with 0% for |01⟩ and |10⟩.",
        "difficulty": "intermediate",
        "instructions": [
            "Allocate 2 qubits (q0 and q1).",
            "Place an H gate on qubit q0 at step 0.",
            "Place a CNOT gate with control on q0 and target on q1 at step 1.",
            "Measure both qubits q0 and q1 into classical register c[2].",
            "Run simulation with 1024 shots.",
            "Confirm that outcomes are evenly split between '00' and '11'."
        ],
        "starter_circuit_json": {
            "schema_version": "1.0.0",
            "name": "Bell State Starter",
            "qubits": 2,
            "classical_bits": 2,
            "gates": [],
            "measurements": [
                {"qubit": 0, "classical_bit": 0},
                {"qubit": 1, "classical_bit": 1}
            ]
        },
        "template_id": "bell-state",
        "required_gates": ["H", "CNOT"],
        "validation_rules": {
            "min_qubits": 2,
            "required_gate_types": ["H", "CNOT"],
            "target_states": {"00": 0.50, "11": 0.50},
            "forbidden_states": ["01", "10"],
            "tolerance": 0.08
        },
        "hints": [
            "Bell state preparation requires exactly 2 gates: H and CNOT.",
            "H(q0) creates superposition: (|00⟩ + |10⟩)/√2.",
            "CNOT(q0, q1) flips q1 only when q0=1: (|00⟩ + |11⟩)/√2."
        ],
        "success_criteria": "Circuit produces approximately 50% |00⟩ and 50% |11⟩ with negligible (<5%) cross-talk on |01⟩ and |10⟩.",
        "explanation": "The composite state cannot be factored into |ψ_0⟩ ⊗ |ψ_1⟩. Measuring q0 immediately collapses q1 to the exact same value with 100% correlation.",
        "estimated_minutes": 12,
        "display_order": 1,
        "xp_reward": 75
    },
    {
        "id": "lab_bell_02",
        "lesson_id": "les_12_bell_states",
        "topic_id": "bell_states",
        "title": "Create the Bell State |Ψ+⟩",
        "description": "Construct the anti-correlated Bell pair |Ψ+⟩ = (|01⟩ + |10⟩)/√2 by flipping target qubit q1 with an X gate before the entanglement sequence.",
        "objective": "Construct X(q1) → H(q0) → CNOT(q0, q1). Verify correlated outcomes '01' and '10' at ~50% each.",
        "difficulty": "advanced",
        "instructions": [
            "Apply an X gate to qubit q1 at step 0 to prepare initial state |01⟩.",
            "Apply an H gate to qubit q0 at step 1.",
            "Apply CNOT with control q0 and target q1 at step 2.",
            "Measure both qubits.",
            "Verify that measured states are |01⟩ and |10⟩."
        ],
        "starter_circuit_json": None,
        "template_id": None,
        "required_gates": ["X", "H", "CNOT"],
        "validation_rules": {
            "min_qubits": 2,
            "min_gate_count": 3,
            "required_gate_types": ["X", "H", "CNOT"],
            "target_states": {"01": 0.50, "10": 0.50},
            "forbidden_states": ["00", "11"],
            "tolerance": 0.08
        },
        "hints": [
            "The four Bell states correspond to the 4 computational basis inputs.",
            "Input |00⟩ produces |Φ+⟩. Input |01⟩ produces |Ψ+⟩.",
            "Use an X gate on q1 to prepare the |01⟩ input before the H and CNOT gates."
        ],
        "success_criteria": "Circuit produces the anti-correlated Bell state |Ψ+⟩ with ~50% |01⟩ and ~50% |10⟩.",
        "explanation": "When the initial state is |01⟩, H on q0 yields (|01⟩ + |11⟩)/√2. The subsequent CNOT flips q1 when q0=1, producing (|01⟩ + |10⟩)/√2.",
        "estimated_minutes": 15,
        "display_order": 2,
        "xp_reward": 80
    },

    # --------------------------------------------------------------------------
    # LESSON 15: Grover's Search Algorithm (mod_algorithms)
    # --------------------------------------------------------------------------
    {
        "id": "lab_grover_01",
        "lesson_id": "les_15_grovers_algorithm",
        "topic_id": "grovers_algorithm",
        "title": "2-Qubit Grover Search for Target |11⟩",
        "description": "Implement a complete 2-qubit Grover search circuit targeting item |11⟩. Apply uniform superposition, the phase oracle (CZ), and the Grover diffusion operator.",
        "objective": "Build H⊗H → CZ(q0, q1) → Diffusion Operator. Measure outcome |11⟩ with 100% probability.",
        "difficulty": "advanced",
        "instructions": [
            "Initialize 2 qubits in ground state |00⟩.",
            "Step 0: Apply H to q0 and H to q1 to prepare uniform superposition.",
            "Step 1 (Oracle): Apply CZ (Controlled-Z) between q0 and q1 to mark target |11⟩ with a -1 phase.",
            "Step 2-4 (Diffusion): Apply H to both qubits, X to both qubits, CZ between q0 and q1, X to both qubits, and H to both qubits.",
            "Measure both qubits.",
            "Simulate and observe constructive amplitude amplification on target |11⟩."
        ],
        "starter_circuit_json": None,
        "template_id": None,
        "required_gates": ["H", "CZ"],
        "validation_rules": {
            "min_qubits": 2,
            "min_gate_count": 5,
            "required_gate_types": ["H", "CZ"],
            "target_states": {"11": 0.85},
            "tolerance": 0.15
        },
        "hints": [
            "A 2-qubit database has N = 4 items. Grover finds the marked item in exactly 1 iteration (π/4 * √4 ≈ 1).",
            "The oracle for |11⟩ is a simple Controlled-Z (CZ) gate, which flips the phase of |11⟩ while leaving |00⟩, |01⟩, |10⟩ positive.",
            "The diffusion operator reflects amplitudes about the mean, boosting |11⟩ to amplitude 1.0!"
        ],
        "success_criteria": "The target state |11⟩ is amplified to >85% measurement probability.",
        "explanation": "In a 2-qubit system, a single Grover iteration achieves 100% theoretical probability of measuring the marked state, demonstrating quadratic search acceleration.",
        "estimated_minutes": 20,
        "display_order": 1,
        "xp_reward": 100
    },

    # --------------------------------------------------------------------------
    # LESSON 18: Building Your First Circuit (mod_programming)
    # --------------------------------------------------------------------------
    {
        "id": "lab_build_01",
        "lesson_id": "les_18_building_first_circuit",
        "topic_id": "circuit_builder",
        "title": "Assemble a Multi-Gate 2-Qubit Pipeline",
        "description": "Construct a complete multi-step quantum circuit combining state initialization, superposition, entanglement, and measurement.",
        "objective": "Place H on q0, X on q1, and CNOT(q0, q1). Verify synchronized Python Qiskit code in Monaco and simulate results.",
        "difficulty": "beginner",
        "instructions": [
            "Place H on q0 at step 0.",
            "Place X on q1 at step 0.",
            "Place CNOT with control q0 and target q1 at step 1.",
            "Inspect the synchronized Python Qiskit editor to verify qc.h(0), qc.x(1), qc.cx(0, 1).",
            "Click 'Run Circuit' and analyze the output distribution."
        ],
        "starter_circuit_json": None,
        "template_id": "empty-2q",
        "required_gates": ["H", "X", "CNOT"],
        "validation_rules": {
            "min_qubits": 2,
            "required_gate_types": ["H", "X", "CNOT"],
            "target_states": {"01": 0.50, "10": 0.50},
            "tolerance": 0.08
        },
        "hints": [
            "Use the Gate Palette to select gates.",
            "Step 0 executes H on wire 0 and X on wire 1 simultaneously.",
            "Step 1 applies CNOT across wires 0 and 1."
        ],
        "success_criteria": "The circuit contains H, X, and CNOT in correct topological order, successfully simulating the Bell state |Ψ+⟩.",
        "explanation": "This exercise tests full-stack circuit authoring: wire allocation, gate scheduling, code synchronization, and simulation dispatch.",
        "estimated_minutes": 10,
        "display_order": 1,
        "xp_reward": 50
    },

    # --------------------------------------------------------------------------
    # LESSON 20: From Circuit to Result (mod_programming)
    # --------------------------------------------------------------------------
    {
        "id": "lab_workflow_01",
        "lesson_id": "les_20_circuit_to_result",
        "topic_id": "quantum_workflow",
        "title": "Comprehensive Quantum Workflow Challenge",
        "description": "Demonstrate end-to-end quantum computing mastery: prepare a 3-qubit GHZ state (|000⟩ + |111⟩)/√2 and verify 3-way entanglement correlation.",
        "objective": "Build H(q0) → CNOT(q0, q1) → CNOT(q1, q2). Verify measurement outcomes ~50% |000⟩ and ~50% |111⟩.",
        "difficulty": "advanced",
        "instructions": [
            "Allocate 3 qubits (q0, q1, q2) and 3 classical bits.",
            "Apply H to q0 at step 0.",
            "Apply CNOT with control q0 and target q1 at step 1.",
            "Apply CNOT with control q1 and target q2 at step 2.",
            "Measure all 3 qubits.",
            "Run 1024 shots and verify GHZ entanglement."
        ],
        "starter_circuit_json": None,
        "template_id": "ghz-state",
        "required_gates": ["H", "CNOT"],
        "validation_rules": {
            "min_qubits": 3,
            "required_gate_types": ["H", "CNOT"],
            "target_states": {"000": 0.50, "111": 0.50},
            "tolerance": 0.10
        },
        "hints": [
            "GHZ state extends Bell pair entanglement to 3 qubits.",
            "First entangle q0 and q1 into (|00⟩ + |11⟩)/√2.",
            "Then use q1 as control to flip q2, producing (|000⟩ + |111⟩)/√2."
        ],
        "success_criteria": "The 3-qubit circuit produces ~50% |000⟩ and ~50% |111⟩ with 0% for other basis states.",
        "explanation": "The GHZ state represents genuine tripartite entanglement used in quantum secret sharing, high-precision quantum metrology, and non-locality tests.",
        "estimated_minutes": 15,
        "display_order": 1,
        "xp_reward": 100
    }
]


def get_lab_problems_for_lesson(lesson_id: str) -> List[Dict[str, Any]]:
    return [p for p in LAB_PROBLEMS_DATA if p["lesson_id"] == lesson_id]


def get_lab_problem_by_id(problem_id: str) -> Dict[str, Any] | None:
    for p in LAB_PROBLEMS_DATA:
        if p["id"] == problem_id:
            return p
    return None
