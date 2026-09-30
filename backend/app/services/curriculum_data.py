"""
QUANTUMANIA - Canonical Quantum Curriculum Dataset
Phase 2: Learning + Curriculum Foundation
20 Structured Lessons across 5 Progressive Modules
"""

CURRICULUM_COURSE = {
    "id": "crs_intro_quantum",
    "title": "Introduction to Quantum Computing",
    "slug": "intro-to-quantum-computing",
    "description": "A comprehensive, beginner-friendly learning path that introduces the foundational principles of quantum mechanics, state vectors, quantum gates, entanglement, quantum algorithms, and Qiskit circuit programming.",
    "difficulty": "beginner",
    "is_published": True,
    "display_order": 1,
    "estimated_hours": 6
}

CURRICULUM_MODULES = [
    {
        "id": "mod_foundations",
        "course_id": "crs_intro_quantum",
        "title": "Module 1: Quantum Computing Foundations",
        "slug": "foundations",
        "description": "Discover the physical motivation behind quantum computers, how qubits differ from classical bits, and the principles of superposition and measurement.",
        "display_order": 1
    },
    {
        "id": "mod_states_gates",
        "course_id": "crs_intro_quantum",
        "title": "Module 2: Quantum States and Gates",
        "slug": "states-and-gates",
        "description": "Master Dirac ket notation, probability amplitudes, normalization, and fundamental single-qubit quantum logic gates including Pauli matrices and the Hadamard gate.",
        "display_order": 2
    },
    {
        "id": "mod_multi_qubit",
        "course_id": "crs_intro_quantum",
        "title": "Module 3: Multi-Qubit Computing",
        "slug": "multi-qubit-computing",
        "description": "Extend quantum concepts to multi-qubit tensor product spaces, controlled operations like CNOT, quantum entanglement, and canonical Bell states.",
        "display_order": 3
    },
    {
        "id": "mod_algorithms",
        "course_id": "crs_intro_quantum",
        "title": "Module 4: Quantum Algorithms",
        "slug": "quantum-algorithms",
        "description": "Explore the algorithmic power of quantum computation: quantum speedup, the Deutsch algorithm, Grover's search, and the Quantum Fourier Transform.",
        "display_order": 4
    },
    {
        "id": "mod_programming",
        "course_id": "crs_intro_quantum",
        "title": "Module 5: Quantum Programming",
        "slug": "quantum-programming",
        "description": "Translate theoretical quantum circuits into executable Python code using Qiskit, understand shot-based sampling, and interpret empirical histograms.",
        "display_order": 5
    }
]

CURRICULUM_LESSONS = [
    # --------------------------------------------------------------------------
    # MODULE 1: FOUNDATIONS (Lessons 1-4)
    # --------------------------------------------------------------------------
    {
        "id": "les_01_what_is_qc",
        "module_id": "mod_foundations",
        "title": "What is Quantum Computing?",
        "slug": "what-is-quantum-computing",
        "description": "Understand the computational motivation, physics paradigms, and real-world boundaries of quantum computers.",
        "estimated_minutes": 10,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 1,
        "objectives": [
            "Distinguish between classical binary computing and quantum information processing",
            "Identify the physical limitations of Moore's Law in silicon transistors",
            "Explain where quantum computing provides computational advantage (chemistry, cryptography, search) versus tasks where classical computing remains superior"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The Evolution of Computation"},
            {"type": "text", "content": "For over seven decades, digital computers have operated on a unified paradigm: electrical voltage levels representing discrete binary digits — 0 (low voltage) and 1 (high voltage). All algorithms, graphics, simulations, and operating systems reduce to billions of tiny semiconductor switches called transistors."},
            {"type": "text", "content": "As transistors shrink to microscopic dimensions approaching single nanometers, quantum mechanical effects such as electron tunneling begin to disrupt reliable binary switching. Quantum computing is not merely an incremental speedup of classical microprocessors; it is a fundamentally different mathematical model of computation governed by the laws of quantum mechanics."},
            {"type": "callout", "variant": "info", "content": "Key Insight: A quantum computer is not simply a faster classical computer. It solves specific problem classes exponentially or quadratically faster by utilizing quantum superposition, phase interference, and entanglement."},
            {"type": "heading", "content": "2. Where Quantum Advantage Applies"},
            {"type": "text", "content": "Quantum computers do not offer universal speedups for everyday tasks like word processing, video streaming, or simple database retrieval. Instead, their power shines in problem domains with vast mathematical solution spaces:"},
            {"type": "bullet_list", "items": [
                "Molecular and Chemical Simulation: Accurately calculating quantum ground states of complex enzymes and battery electrolytes without exponential classical overhead.",
                "Cryptographic Factorization: Factoring large semi-prime integers (Shor's Algorithm) in polynomial time rather than exponential time.",
                "Combinatorial Optimization: Finding global minima in logistics, drug discovery, and financial risk modeling using quantum interference.",
                "Unstructured Search: Accelerating unstructured database searches from O(N) to O(sqrt(N)) using Grover's Algorithm."
            ]},
            {"type": "example", "title": "Classical vs Quantum Scaling", "content": "Simulating a quantum molecule with just 50 interacting electrons requires 2^50 complex numbers — roughly 16 petabytes of classical RAM. At 300 electrons, 2^300 exceeds the total number of atoms in the observable universe. A quantum computer with 300 qubits natively holds this state in its Hilbert space."}
        ],
        "content_markdown": "# What is Quantum Computing?\n\nDiscover classical vs quantum computing paradigms and where quantum advantage matters.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_02_bits_vs_qubits",
        "module_id": "mod_foundations",
        "title": "Bits vs Qubits",
        "slug": "bits-vs-qubits",
        "description": "Compare classical bits with two-level quantum systems and explore the mathematical representation of state vectors.",
        "estimated_minutes": 10,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 2,
        "objectives": [
            "Define the mathematical and physical concept of a quantum bit (qubit)",
            "Express the computational basis states |0⟩ and |1⟩ as column vectors",
            "Contrast classical deterministic state spaces with two-dimensional complex Hilbert spaces"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The Classical Bit"},
            {"type": "text", "content": "A classical bit is deterministic and binary. At any given moment in time, its state is either precisely 0 or precisely 1. Mathematically, the state space of a classical bit consists of just two isolated discrete points: {0, 1}."},
            {"type": "heading", "content": "2. Introducing the Qubit"},
            {"type": "text", "content": "A qubit (quantum bit) is a two-level quantum physical system. Common experimental physical implementations include the spin of an electron (spin-up vs spin-down), the polarization of a photon (horizontal vs vertical), or superconducting Josephson junction circuits (energy levels)."},
            {"type": "text", "content": "Using Paul Dirac's bra-ket notation, we label the two orthonormal basis states as:"},
            {"type": "equation", "content": "|0⟩ = [1, 0]^T   and   |1⟩ = [0, 1]^T"},
            {"type": "callout", "variant": "formula", "content": "Dirac Ket: The symbol |ψ⟩ is called a 'ket' and denotes a column vector in a complex vector space. The computational basis kets |0⟩ and |1⟩ form an orthonormal basis for C^2."},
            {"type": "heading", "content": "3. The Continuum of Quantum States"},
            {"type": "text", "content": "Unlike a classical bit which is locked into either 0 or 1, a qubit's state can be any linear combination of |0⟩ and |1⟩ on the surface of a continuous geometric sphere known as the Bloch Sphere. We write the general single-qubit state as:"},
            {"type": "equation", "content": "|ψ⟩ = α|0⟩ + β|1⟩"},
            {"type": "text", "content": "Here, α and β are complex numbers representing probability amplitudes, obeying the fundamental conservation of probability: |α|^2 + |β|^2 = 1."}
        ],
        "content_markdown": "# Bits vs Qubits\n\nUnderstand qubits as 2-dimensional complex vector spaces.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_03_superposition",
        "module_id": "mod_foundations",
        "title": "Superposition",
        "slug": "superposition",
        "description": "Grasp the true meaning of quantum superposition through probability amplitudes and phase interference.",
        "estimated_minutes": 12,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 3,
        "objectives": [
            "Explain quantum superposition using complex linear combinations rather than classical ambiguity",
            "Calculate measurement probabilities from complex probability amplitudes",
            "Understand why a qubit is NOT simply 'both 0 and 1 at the same time' in the classical sense"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. Demystifying Superposition"},
            {"type": "text", "content": "A common misconception popularized in science media is that a qubit in superposition is 'literally both 0 and 1 simultaneously'. In physics, this is mathematically inaccurate and leads to profound confusion."},
            {"type": "callout", "variant": "warning", "content": "Common Pitfall: Superposition is NOT classical ignorance. A classical coin spinning on a table is in an unknown state of heads or tails due to lack of measurement. A qubit in superposition is in a definite, pure quantum state that possesses both amplitude and relative phase."},
            {"type": "heading", "content": "2. Probability Amplitudes"},
            {"type": "text", "content": "In quantum mechanics, probabilities are not assigned directly to states. Instead, nature assigns complex numbers called probability amplitudes. For a state |ψ⟩ = α|0⟩ + β|1⟩:"},
            {"type": "bullet_list", "items": [
                "α is the complex amplitude of observing state |0⟩ upon measurement.",
                "β is the complex amplitude of observing state |1⟩ upon measurement.",
                "The probability of measuring outcome 0 is P(0) = |α|^2.",
                "The probability of measuring outcome 1 is P(1) = |β|^2."
            ]},
            {"type": "heading", "content": "3. Equal Superposition State"},
            {"type": "text", "content": "Consider the state with equal weighting α = 1/√2 and β = 1/√2:"},
            {"type": "equation", "content": "|+⟩ = (1/√2)|0⟩ + (1/√2)|1⟩"},
            {"type": "text", "content": "Measuring this state yields outcome 0 with probability |1/√2|^2 = 1/2 (50%) and outcome 1 with probability |1/√2|^2 = 1/2 (50%)."},
            {"type": "example", "title": "Why Phase Matters", "content": "Consider state |-⟩ = (1/√2)|0⟩ - (1/√2)|1⟩. It also has 50% probability for 0 and 50% for 1. Yet |+⟩ and |-⟩ are completely orthogonal states (inner product = 0)! The relative minus sign (phase) enables destructive interference, which quantum algorithms use to cancel out incorrect answers."}
        ],
        "content_markdown": "# Superposition\n\nDeep dive into probability amplitudes and linear combinations.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_04_measurement",
        "module_id": "mod_foundations",
        "title": "Quantum Measurement and State Collapse",
        "slug": "quantum-measurement",
        "description": "Learn the Born rule, projective measurement, irreversible state collapse, and statistical sampling across multiple shots.",
        "estimated_minutes": 12,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 4,
        "objectives": [
            "State the Born Rule for projective measurement in the computational basis",
            "Explain wave function collapse and why measurement is irreversible",
            "Differentiate single-shot stochastic outcomes from aggregate probability distributions"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The Act of Measurement"},
            {"type": "text", "content": "In classical physics, observing a system does not fundamentally alter its physical state. A sensor measuring the voltage of a circuit does not change a 1 into a 0. In quantum mechanics, measurement is an active, irreversible physical operation that alters the state of the system."},
            {"type": "heading", "content": "2. Wave Function Collapse"},
            {"type": "text", "content": "When a qubit in state |ψ⟩ = α|0⟩ + β|1⟩ is measured in the computational basis {|0⟩, |1⟩}, it instantaneously collapses onto one of the basis states:"},
            {"type": "bullet_list", "items": [
                "With probability P(0) = |α|^2, the measurement yields classical bit '0', and the post-measurement state becomes |0⟩.",
                "With probability P(1) = |β|^2, the measurement yields classical bit '1', and the post-measurement state becomes |1⟩."
            ]},
            {"type": "callout", "variant": "info", "content": "Post-Measurement State: Once measured, all superposition is destroyed. Immediate subsequent measurements will yield the exact same collapsed result with 100% certainty."},
            {"type": "heading", "content": "3. Shots and Empirical Histograms"},
            {"type": "text", "content": "Because an individual measurement produces only a single classical bit (0 or 1), a quantum computer must run a circuit repeatedly across many 'shots' (e.g., 1024 or 4096 runs) to reconstruct the underlying probability distribution."},
            {"type": "example", "title": "Sample 1024-Shot Run", "content": "For state |+⟩, running 1024 shots might produce: Outcome '0': 518 counts (50.59%), Outcome '1': 506 counts (49.41%). As the number of shots approaches infinity, the observed frequencies converge exactly to the theoretical Born probabilities."}
        ],
        "content_markdown": "# Quantum Measurement and State Collapse\n\nUnderstand the Born rule and why measurement destroys superposition.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },

    # --------------------------------------------------------------------------
    # MODULE 2: STATES AND GATES (Lessons 5-8)
    # --------------------------------------------------------------------------
    {
        "id": "les_05_quantum_states",
        "module_id": "mod_states_gates",
        "title": "Quantum States and Normalization",
        "slug": "quantum-states-normalization",
        "description": "Master Dirac ket notation, state vector algebra, inner products, and the mandatory normalization condition.",
        "estimated_minutes": 10,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 1,
        "objectives": [
            "Write single-qubit quantum states as two-dimensional complex vectors",
            "Verify whether an arbitrary state vector satisfies the normalization constraint",
            "Compute the inner product ⟨ψ|φ⟩ between two quantum state vectors"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. Vector Representation of Qubits"},
            {"type": "text", "content": "Any single-qubit quantum state lives in a 2-dimensional complex Hilbert space C^2. We represent states as column vectors with respect to the computational basis {|0⟩, |1⟩}:"},
            {"type": "equation", "content": "|ψ⟩ = [α, β]^T = α|0⟩ + β|1⟩"},
            {"type": "heading", "content": "2. The Normalization Condition"},
            {"type": "text", "content": "Because the total probability of all mutually exclusive measurement outcomes must equal 100%, every physical state must be normalized:"},
            {"type": "equation", "content": "⟨ψ|ψ⟩ = |α|^2 + |β|^2 = 1"},
            {"type": "callout", "variant": "formula", "content": "Dirac Bra: The 'bra' ⟨ψ| is the conjugate transpose (Hermitian adjoint) of |ψ⟩: ⟨ψ| = [α*, β*]. The inner product ⟨ψ|ψ⟩ produces a real scalar equal to the squared Euclidean norm."},
            {"type": "example", "title": "Normalization Example", "content": "Consider |ψ⟩ = (1/2)|0⟩ + c|1⟩. For normalization: (1/2)^2 + |c|^2 = 1 => 1/4 + |c|^2 = 1 => |c|^2 = 3/4 => c = √3/2. Thus |ψ⟩ = (1/2)|0⟩ + (√3/2)|1⟩."}
        ],
        "content_markdown": "# Quantum States and Normalization\n\nLearn Dirac notation and state vector mathematics.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_06_quantum_gates",
        "module_id": "mod_states_gates",
        "title": "Introduction to Quantum Gates",
        "slug": "quantum-gates",
        "description": "Understand quantum logic gates as reversible unitary matrix transformations operating on state vectors.",
        "estimated_minutes": 12,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 2,
        "objectives": [
            "Define quantum gates as unitary linear transformations",
            "Explain why quantum operations must be reversible, unlike classical AND/OR gates",
            "Calculate the output state vector resulting from applying a gate matrix to a ket"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. Reversible Computation"},
            {"type": "text", "content": "In classical computing, many fundamental logic gates are irreversible. An AND gate takes 2 input bits and produces 1 output bit; if the output is 0, you cannot determine whether the input was (0,0), (0,1), or (1,0). This loss of information dissipates energy as heat (Landauer's Principle)."},
            {"type": "text", "content": "In contrast, quantum mechanics is strictly reversible (unitary) until measurement occurs. For every quantum gate U, there exists an inverse gate U† such that U† U = I."},
            {"type": "heading", "content": "2. Unitary Matrices"},
            {"type": "text", "content": "A quantum gate acting on a single qubit is represented mathematically by a 2x2 complex unitary matrix U satisfying:"},
            {"type": "equation", "content": "U† U = U U† = I"},
            {"type": "text", "content": "Unitary matrices preserve the norm of state vectors, guaranteeing that if the input state is normalized, the output state remains normalized (|α'|^2 + |β'|^2 = 1)."}
        ],
        "content_markdown": "# Introduction to Quantum Gates\n\nLearn why quantum gates are unitary and reversible.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_07_hadamard_gate",
        "module_id": "mod_states_gates",
        "title": "The Hadamard Gate",
        "slug": "hadamard-gate",
        "description": "Deep dive into the Hadamard operator, the gateway to superposition and quantum interference.",
        "estimated_minutes": 12,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 3,
        "objectives": [
            "Write the matrix representation of the Hadamard gate (H)",
            "Compute the action of H on basis states |0⟩ and |1⟩",
            "Explain how applying H twice recovers the original state: H * H = I"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The Superposition Creator"},
            {"type": "text", "content": "The Hadamard gate (denoted H) is the single most important single-qubit gate in quantum computing. It transforms deterministic computational basis states into unbiased superposition states."},
            {"type": "equation", "content": "H = (1/√2) * [[1, 1], [1, -1]]"},
            {"type": "heading", "content": "2. Action on Basis States"},
            {"type": "bullet_list", "items": [
                "H|0⟩ = (1/√2)(|0⟩ + |1⟩) ≡ |+⟩",
                "H|1⟩ = (1/√2)(|0⟩ - |1⟩) ≡ |-⟩"
            ]},
            {"type": "callout", "variant": "tip", "content": "Self-Inverse Property: The Hadamard gate is its own Hermitian conjugate and inverse: H = H† and H^2 = I. Applying Hadamard twice returns the qubit to its initial state!"},
            {"type": "example", "title": "Interference Demo in Circuit Lab", "content": "If you apply H to |0⟩, you get an equal 50/50 superposition of |0⟩ and |1⟩. If you apply H a second time, constructive interference boosts amplitude of |0⟩ to 1.0, while destructive interference cancels amplitude of |1⟩ to 0.0."}
        ],
        "content_markdown": "# The Hadamard Gate\n\nMaster the Hadamard gate and quantum interference.",
        "initial_circuit_json": {
            "schema_version": "1.0.0",
            "name": "Single Qubit Superposition",
            "qubits": 1,
            "classical_bits": 1,
            "gates": [{"type": "H", "targets": [0], "step": 0}],
            "measurements": [{"qubit": 0, "classical_bit": 0}]
        },
        "interactive_meta_json": {
            "type": "quantum_lab",
            "templateId": "hadamard_superposition",
            "label": "Open Hadamard in Quantum Lab"
        }
    },
    {
        "id": "les_08_pauli_gates",
        "module_id": "mod_states_gates",
        "title": "Pauli Gates (X, Y, Z)",
        "slug": "pauli-gates",
        "description": "Explore the three foundational Pauli operators: bit-flip (X), phase-flip (Z), and combined (Y).",
        "estimated_minutes": 10,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 4,
        "objectives": [
            "Define the matrices and actions of Pauli X, Y, and Z gates",
            "Identify the Pauli-X gate as the quantum NOT operator",
            "Explain the action of the Pauli-Z gate on relative phase without altering measurement probabilities"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The Pauli-X Gate (Quantum NOT)"},
            {"type": "text", "content": "The Pauli-X gate flips the computational basis states, acting identically to a classical NOT gate:"},
            {"type": "equation", "content": "X = [[0, 1], [1, 0]]    =>    X|0⟩ = |1⟩,   X|1⟩ = |0⟩"},
            {"type": "heading", "content": "2. The Pauli-Z Gate (Phase Flip)"},
            {"type": "text", "content": "The Pauli-Z gate leaves |0⟩ unchanged while multiplying the amplitude of |1⟩ by -1. Crucially, it leaves measurement probabilities in the computational basis unchanged, but flips relative phase:"},
            {"type": "equation", "content": "Z = [[1, 0], [0, -1]]    =>    Z|0⟩ = |0⟩,   Z|1⟩ = -|1⟩"},
            {"type": "heading", "content": "3. The Pauli-Y Gate"},
            {"type": "text", "content": "The Pauli-Y gate performs both a bit-flip and a phase-flip accompanied by an imaginary coefficient:"},
            {"type": "equation", "content": "Y = [[0, -i], [i, 0]]    =>    Y|0⟩ = i|1⟩,   Y|1⟩ = -i|0⟩"}
        ],
        "content_markdown": "# Pauli Gates (X, Y, Z)\n\nLearn the Pauli matrix gates.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },

    # --------------------------------------------------------------------------
    # MODULE 3: MULTI-QUBIT COMPUTING (Lessons 9-12)
    # --------------------------------------------------------------------------
    {
        "id": "les_09_multiple_qubits",
        "module_id": "mod_multi_qubit",
        "title": "Multiple Qubits and Tensor Products",
        "slug": "multiple-qubits-tensor-products",
        "description": "Understand multi-qubit state spaces, Kronecker tensor products, and computational basis combinations.",
        "estimated_minutes": 12,
        "difficulty": "intermediate",
        "xp_reward": 25,
        "display_order": 1,
        "objectives": [
            "Construct multi-qubit state vectors using the tensor product (⊗)",
            "List the 4 orthonormal basis states for a two-qubit quantum register",
            "Relate register size n to the exponential state space dimension 2^n"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. Combining Quantum Systems"},
            {"type": "text", "content": "When two or more independent qubits are combined into a multi-qubit register, the composite state space is given by the tensor product (Kronecker product ⊗) of their individual Hilbert spaces."},
            {"type": "heading", "content": "2. Two-Qubit Basis States"},
            {"type": "text", "content": "For a 2-qubit system, there are 2^2 = 4 basis states, represented as 4-dimensional column vectors:"},
            {"type": "bullet_list", "items": [
                "|00⟩ = |0⟩ ⊗ |0⟩ = [1, 0, 0, 0]^T",
                "|01⟩ = |0⟩ ⊗ |1⟩ = [0, 1, 0, 0]^T",
                "|10⟩ = |1⟩ ⊗ |0⟩ = [0, 0, 1, 0]^T",
                "|11⟩ = |1⟩ ⊗ |1⟩ = [0, 0, 0, 1]^T"
            ]},
            {"type": "callout", "variant": "info", "content": "Qubit Ordering Convention: In QUANTUMANIA (and Qiskit), bitstrings use little-endian notation |q1 q0⟩ where q0 is the least significant qubit and top wire."}
        ],
        "content_markdown": "# Multiple Qubits\n\nUnderstand tensor products and 4D state spaces.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_10_controlled_operations",
        "module_id": "mod_multi_qubit",
        "title": "Controlled Operations (CNOT)",
        "slug": "controlled-operations-cnot",
        "description": "Learn controlled quantum logic gates with the Controlled-NOT (CNOT) gate as the cornerstone of 2-qubit interactions.",
        "estimated_minutes": 12,
        "difficulty": "intermediate",
        "xp_reward": 25,
        "display_order": 2,
        "objectives": [
            "Explain the control-target relationship in a CNOT gate",
            "Write the 4x4 matrix representation of the CNOT gate",
            "Evaluate CNOT operations across all 4 computational basis inputs"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The Controlled-NOT Gate"},
            {"type": "text", "content": "The Controlled-NOT gate (abbreviated CNOT or CX) acts on two qubits: a control qubit and a target qubit. If the control qubit is in state |1⟩, it applies a Pauli-X (NOT) flip to the target qubit; if the control qubit is |0⟩, the target is untouched."},
            {"type": "heading", "content": "2. Basis Truth Table"},
            {"type": "bullet_list", "items": [
                "CNOT |00⟩ = |00⟩  (Control is 0 => target unchanged)",
                "CNOT |01⟩ = |01⟩  (Control is 0 => target unchanged)",
                "CNOT |10⟩ = |11⟩  (Control is 1 => target flipped 0 -> 1)",
                "CNOT |11⟩ = |10⟩  (Control is 1 => target flipped 1 -> 0)"
            ]},
            {"type": "callout", "variant": "formula", "content": "CNOT Matrix: A 4x4 permutation matrix with identity in the top-left 2x2 and Pauli-X in the bottom-right 2x2 block."}
        ],
        "content_markdown": "# Controlled Operations (CNOT)\n\nMaster the CNOT gate.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_11_entanglement",
        "module_id": "mod_multi_qubit",
        "title": "Quantum Entanglement",
        "slug": "quantum-entanglement",
        "description": "Unpack the non-classical physical phenomenon of quantum entanglement and state inseparability.",
        "estimated_minutes": 15,
        "difficulty": "intermediate",
        "xp_reward": 25,
        "display_order": 3,
        "objectives": [
            "Define entanglement as state inseparability: |ψ⟩ ≠ |ψ_A⟩ ⊗ |ψ_B⟩",
            "Explain why entangled states exhibit stronger-than-classical statistical correlations",
            "Differentiate single-qubit superposition from two-qubit entanglement"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. What is Entanglement?"},
            {"type": "text", "content": "Two particles are entangled when their composite quantum state cannot be decomposed into a product of individual single-qubit states. In an entangled system, you cannot describe the physical state of either qubit in isolation."},
            {"type": "heading", "content": "2. Separable vs Entangled States"},
            {"type": "text", "content": "Consider the state |ψ⟩ = (|00⟩ + |01⟩)/√2 = |0⟩ ⊗ ((|0⟩ + |1⟩)/√2). This state is separable: qubit 0 is in superposition, while qubit 1 is definitely in state |0⟩."},
            {"type": "text", "content": "Now consider the Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2. No matter what values you choose for (a0, a1) and (b0, b1), you cannot write |Φ+⟩ as (a0|0⟩ + a1|1⟩) ⊗ (b0|0⟩ + b1|1⟩). It is fundamentally entangled."},
            {"type": "callout", "variant": "info", "content": "Einstein-Podolsky-Rosen (EPR): Albert Einstein famously referred to entanglement as 'spooky action at a distance' because measuring one qubit instantaneously determines the measurement outcome of the other, regardless of spatial separation."}
        ],
        "content_markdown": "# Quantum Entanglement\n\nUnderstand state inseparability and non-classical correlations.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_12_bell_states",
        "module_id": "mod_multi_qubit",
        "title": "Creating Bell States",
        "slug": "bell-states",
        "description": "Construct the canonical Bell state using a Hadamard gate and a CNOT gate on the quantum circuit timeline.",
        "estimated_minutes": 15,
        "difficulty": "intermediate",
        "xp_reward": 25,
        "display_order": 4,
        "objectives": [
            "Construct a 2-qubit circuit creating the maximally entangled Bell pair |Φ+⟩",
            "Trace the step-by-step state vector transformation through H and CNOT",
            "Predict measurement outcome counts (50% |00⟩, 50% |11⟩) with 1024 simulation shots"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The 2-Gate Entanglement Recipe"},
            {"type": "text", "content": "Creating maximal entanglement requires only two quantum gates executed sequentially:"},
            {"type": "numbered_list", "items": [
                "Initialize two qubits in state |00⟩.",
                "Apply a Hadamard gate (H) to qubit 0 to generate superposition: (|0⟩ + |1⟩)/√2 ⊗ |0⟩ = (|00⟩ + |10⟩)/√2.",
                "Apply a CNOT gate with qubit 0 as control and qubit 1 as target. This flips qubit 1 only when qubit 0 is 1: (|00⟩ + |11⟩)/√2."
            ]},
            {"type": "heading", "content": "2. The Four Maximally Entangled Bell Basis States"},
            {"type": "bullet_list", "items": [
                "|Φ+⟩ = (|00⟩ + |11⟩)/√2",
                "|Φ-⟩ = (|00⟩ - |11⟩)/√2",
                "|Ψ+⟩ = (|01⟩ + |10⟩)/√2",
                "|Ψ-⟩ = (|01⟩ - |10⟩)/√2"
            ]},
            {"type": "callout", "variant": "tip", "content": "Tanishq's Quantum Lab Integration: Click below to load this exact 2-qubit Bell circuit into the Quantum Lab to simulate 1024 shots!"}
        ],
        "content_markdown": "# Creating Bell States\n\nStep-by-step construction of the Bell State |Phi+>.",
        "initial_circuit_json": {
            "schema_version": "1.0.0",
            "name": "Bell State (|Phi+>)",
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"id": "g-1", "type": "H", "targets": [0], "step": 0},
                {"id": "g-2", "type": "CNOT", "control": 0, "target": 1, "step": 1}
            ],
            "measurements": [
                {"qubit": 0, "classical_bit": 0},
                {"qubit": 1, "classical_bit": 1}
            ]
        },
        "interactive_meta_json": {
            "type": "quantum_lab",
            "templateId": "bell_state_phi_plus",
            "label": "Open Bell State in Quantum Lab"
        }
    },

    # --------------------------------------------------------------------------
    # MODULE 4: QUANTUM ALGORITHMS (Lessons 13-16)
    # --------------------------------------------------------------------------
    {
        "id": "les_13_what_is_quantum_algorithm",
        "module_id": "mod_algorithms",
        "title": "What is a Quantum Algorithm?",
        "slug": "what-is-a-quantum-algorithm",
        "description": "Understand how quantum parallelism and destructive interference combine to produce computational advantage.",
        "estimated_minutes": 10,
        "difficulty": "intermediate",
        "xp_reward": 25,
        "display_order": 1,
        "objectives": [
            "Explain quantum parallelism via Hadamard transform over n qubits",
            "Describe the critical role of constructive and destructive interference",
            "Define the concept of quantum speedup (polynomial vs exponential)"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. Beyond Classical Algorithms"},
            {"type": "text", "content": "A classical algorithm is a sequential or parallel set of deterministic instructions operating on discrete bits. A quantum algorithm is a unitary operator U designed to guide a quantum state such that the correct answer is amplified by constructive interference, while incorrect answers are extinguished by destructive interference."},
            {"type": "heading", "content": "2. Quantum Parallelism"},
            {"type": "text", "content": "By applying an H gate to each of n qubits initialized to |0⟩, we place the register into an equal superposition of all 2^n possible input states in a single clock step:"},
            {"type": "equation", "content": "H^⊗n |0...0⟩ = (1/√(2^n)) ∑_{x=0}^{2^n - 1} |x⟩"},
            {"type": "text", "content": "However, measuring immediately would simply yield a uniformly random state! The art of quantum algorithm design is engineering phase changes so that measurement yields the targeted answer with high probability."}
        ],
        "content_markdown": "# What is a Quantum Algorithm?\n\nLearn the foundations of quantum speedup and interference.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_14_deutsch_algorithm",
        "module_id": "mod_algorithms",
        "title": "The Deutsch Algorithm",
        "slug": "deutsch-algorithm",
        "description": "Study the historic first algorithm proving deterministic quantum speedup using phase kickback.",
        "estimated_minutes": 15,
        "difficulty": "intermediate",
        "xp_reward": 25,
        "display_order": 2,
        "objectives": [
            "Formulate the Deutsch problem: distinguishing constant vs balanced boolean functions",
            "Demonstrate how the quantum algorithm solves the problem in 1 query versus 2 classical queries",
            "Explain the phase kickback mechanism"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The Black-Box (Oracle) Problem"},
            {"type": "text", "content": "Suppose you are given a black-box function f(x) that maps {0, 1} -> {0, 1}. The function is guaranteed to be either Constant (f(0) == f(1)) or Balanced (f(0) != f(1))."},
            {"type": "text", "content": "Classically, you must evaluate f(0) and then evaluate f(1) — requiring 2 queries in the worst case. David Deutsch proved in 1985 that a quantum computer can determine whether f is constant or balanced in just 1 single evaluation!"},
            {"type": "heading", "content": "2. Phase Kickback"},
            {"type": "text", "content": "By preparing the second (ancilla) qubit in state |-⟩ = (|0⟩ - |1⟩)/√2 and applying the oracle U_f, the value f(x) is kicked back into the phase of the first qubit:"},
            {"type": "equation", "content": "U_f (|x⟩ |-⟩) = (-1)^f(x) |x⟩ |-⟩"},
            {"type": "text", "content": "A final Hadamard on the first qubit causes constructive interference to |0⟩ if constant, and |1⟩ if balanced!"}
        ],
        "content_markdown": "# The Deutsch Algorithm\n\nExplore the first quantum algorithm to demonstrate quantum speedup.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_15_grovers_algorithm",
        "module_id": "mod_algorithms",
        "title": "Grover's Search Algorithm",
        "slug": "grovers-algorithm",
        "description": "Discover amplitude amplification and quadratic speedup for searching unstructured databases.",
        "estimated_minutes": 15,
        "difficulty": "intermediate",
        "xp_reward": 25,
        "display_order": 3,
        "objectives": [
            "State the unstructured database search problem across N items",
            "Explain the quadratic speedup: O(√N) quantum steps vs O(N) classical steps",
            "Describe the geometric intuition behind the Grover diffusion operator (reflection about the average)"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The Unstructured Search Problem"},
            {"type": "text", "content": "Imagine searching through an unsorted phonebook of N = 1,000,000 entries. Classically, you must check entries one by one, requiring on average N/2 = 500,000 lookups."},
            {"type": "text", "content": "Lov Grover discovered in 1996 that a quantum computer can find the marked item in approximately (π/4)√N steps. For 1,000,000 items, √1,000,000 = 1,000 steps — a 500x speedup!"},
            {"type": "heading", "content": "2. Geometric Amplitude Amplification"},
            {"type": "text", "content": "Grover's algorithm alternates between two steps:"},
            {"type": "numbered_list", "items": [
                "Oracle Inversion: Flips the phase of the marked target item: |x_target⟩ -> -|x_target⟩.",
                "Diffusion Operator (Inversion about the Mean): Reflects all state amplitudes about their average. This subtracts amplitude from all unmarked items and boosts the amplitude of the marked item."
            ]},
            {"type": "callout", "variant": "info", "content": "Quadratic Advantage: Grover's search provides a provable polynomial speedup for NP-complete search problems, cryptanalysis, and collision finding."}
        ],
        "content_markdown": "# Grover's Search Algorithm\n\nUnderstand amplitude amplification and quadratic speedup.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_16_quantum_fourier_transform",
        "module_id": "mod_algorithms",
        "title": "Quantum Fourier Transform (QFT)",
        "slug": "quantum-fourier-transform",
        "description": "Explore the quantum analogue of the Discrete Fourier Transform and its role in exponential algorithm speedups.",
        "estimated_minutes": 15,
        "difficulty": "intermediate",
        "xp_reward": 25,
        "display_order": 4,
        "objectives": [
            "Compare the classical Fast Fourier Transform (FFT) with the Quantum Fourier Transform (QFT)",
            "Explain how the QFT maps computational basis states into phase-encoded periodic states",
            "Describe the foundational role of QFT in Shor's factoring algorithm and quantum phase estimation"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. From FFT to QFT"},
            {"type": "text", "content": "The Discrete Fourier Transform (DFT) is one of the most widely used mathematical tools in engineering, audio processing, and signal analysis. The best classical algorithm (FFT) requires O(N log N) operations for N data points."},
            {"type": "text", "content": "The Quantum Fourier Transform operates on the amplitudes of an n-qubit quantum state (where N = 2^n) in only O(n^2) = O((log N)^2) gate operations — an exponential reduction in circuit complexity!"},
            {"type": "heading", "content": "2. The Backbone of Shor's Algorithm"},
            {"type": "text", "content": "While you cannot directly read out all 2^n Fourier amplitudes due to measurement collapse, the QFT is used internally as a subroutine in Quantum Phase Estimation and Shor's Algorithm to extract hidden mathematical periodicities of functions."}
        ],
        "content_markdown": "# Quantum Fourier Transform (QFT)\n\nLearn the conceptual power of QFT and phase estimation.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },

    # --------------------------------------------------------------------------
    # MODULE 5: QUANTUM PROGRAMMING (Lessons 17-20)
    # --------------------------------------------------------------------------
    {
        "id": "les_17_intro_to_qiskit",
        "module_id": "mod_programming",
        "title": "Introduction to Qiskit",
        "slug": "introduction-to-qiskit",
        "description": "Learn IBM's open-source Qiskit SDK: QuantumCircuit, QuantumRegister, gate methods, and simulation backends.",
        "estimated_minutes": 12,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 1,
        "objectives": [
            "Install and import core components from the Qiskit library",
            "Instantiate a QuantumCircuit object with quantum and classical registers",
            "Apply single-qubit and two-qubit gate instructions via Python method calls"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. What is Qiskit?"},
            {"type": "text", "content": "Qiskit is the world's most widely adopted open-source software development kit for working with quantum computers at the level of circuits, pulses, and algorithms. It allows you to compose circuits locally in Python and execute them either on local simulators or cloud-based quantum hardware."},
            {"type": "heading", "content": "2. Creating a QuantumCircuit Object"},
            {"type": "text", "content": "A circuit in Qiskit is instantiated by specifying the number of quantum bits (wires) and classical bits (for measurement storage):"},
            {"type": "code", "language": "python", "content": "from qiskit import QuantumCircuit\n\n# Create a circuit with 2 qubits and 2 classical bits\nqc = QuantumCircuit(2, 2)\n\n# Apply Hadamard to qubit 0\nqc.h(0)\n\n# Apply CNOT with control qubit 0 and target qubit 1\nqc.cx(0, 1)\n\n# Measure both qubits onto classical register\nqc.measure([0, 1], [0, 1])\n\nprint(qc)"},
            {"type": "callout", "variant": "tip", "content": "QUANTUMANIA Export: In future Phase 5, the AI Tutor includes an automated code generation tool that exports your visual canvas directly into executable Qiskit code!"}
        ],
        "content_markdown": "# Introduction to Qiskit\n\nLearn the fundamentals of Qiskit SDK.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_18_building_first_circuit",
        "module_id": "mod_programming",
        "title": "Building Your First Circuit",
        "slug": "building-your-first-circuit",
        "description": "Step-by-step methodology to construct, verify, and measure an interactive quantum circuit.",
        "estimated_minutes": 12,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 2,
        "objectives": [
            "Execute the 5-step quantum circuit construction lifecycle",
            "Synthesize wire allocation, gate placement, and projective measurement",
            "Verify circuit structure against the canonical QUANTUMANIA schema"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The 5-Step Circuit Lifecycle"},
            {"type": "numbered_list", "items": [
                "Allocate Registers: Decide how many qubits and classical bits your algorithm requires.",
                "State Preparation: Apply single-qubit gates (like H) to initialize superposition.",
                "Entanglement & Logic: Apply multi-qubit gates (like CNOT) to perform quantum logic.",
                "Measurement: Project quantum wires into classical bits.",
                "Execution: Dispatch to simulator or quantum processor."
            ]},
            {"type": "example", "title": "Interactive Circuit Launch", "content": "This lesson prepares you directly for Tanishq's Phase 3 Circuit Builder. Click below to view the circuit layout on the workbench!"}
        ],
        "content_markdown": "# Building Your First Circuit\n\nStep-by-step circuit construction workflow.",
        "initial_circuit_json": {
            "schema_version": "1.0.0",
            "name": "First Quantum Circuit",
            "qubits": 2,
            "classical_bits": 2,
            "gates": [
                {"id": "g-1", "type": "H", "targets": [0], "step": 0},
                {"id": "g-2", "type": "X", "targets": [1], "step": 0},
                {"id": "g-3", "type": "CNOT", "control": 0, "target": 1, "step": 1}
            ],
            "measurements": [
                {"qubit": 0, "classical_bit": 0},
                {"qubit": 1, "classical_bit": 1}
            ]
        },
        "interactive_meta_json": {
            "type": "quantum_lab",
            "templateId": "first_circuit_template",
            "label": "Open First Circuit in Quantum Lab"
        }
    },
    {
        "id": "les_19_running_quantum_circuit",
        "module_id": "mod_programming",
        "title": "Running a Quantum Circuit",
        "slug": "running-quantum-circuit",
        "description": "Understand shot count configuration, statevector simulation, and sampling statistical noise.",
        "estimated_minutes": 10,
        "difficulty": "beginner",
        "xp_reward": 25,
        "display_order": 3,
        "objectives": [
            "Explain the difference between analytical statevector calculation and shot-based sampling",
            "Interpret empirical shot histograms and identify Poissonian statistical fluctuation",
            "Configure simulator parameters (shots = 1024, 4096, 8192)"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. Simulators vs Hardware"},
            {"type": "text", "content": "On a classical computer, quantum simulators can operate in two primary modes:"},
            {"type": "bullet_list", "items": [
                "Analytical Statevector Mode: Keeps track of the exact 2^n complex numbers. Yields perfect mathematical probabilities (e.g. exactly 0.50000).",
                "Shot-based Sampling Mode: Simulates physical quantum hardware by performing pseudo-random projective collapse N times (shots)."
            ]},
            {"type": "heading", "content": "2. Shot Noise and Convergence"},
            {"type": "text", "content": "With 1024 shots on a 50/50 state, you may observe 514 vs 510 counts. The standard deviation of statistical sampling noise scales as 1/√N. Increasing shots from 1024 to 4096 halves the statistical error!"}
        ],
        "content_markdown": "# Running a Quantum Circuit\n\nUnderstand simulator shots and sampling noise.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    },
    {
        "id": "les_20_circuit_to_result",
        "module_id": "mod_programming",
        "title": "From Circuit to Result: The Complete Workflow",
        "slug": "circuit-to-result-workflow",
        "description": "Synthesize the entire quantum engineering cycle from abstract hypothesis to verified physical result.",
        "estimated_minutes": 15,
        "difficulty": "intermediate",
        "xp_reward": 25,
        "display_order": 4,
        "objectives": [
            "Map the full lifecycle: Theory -> Circuit Canvas -> Simulator Engine -> Histogram -> AI Explanation",
            "Correlate circuit depth with simulation execution latency",
            "Synthesize course knowledge to prepare for Phase 3 Circuit Builder and Phase 6 Challenges"
        ],
        "content_blocks": [
            {"type": "heading", "content": "1. The Quantum Engineering Loop"},
            {"type": "text", "content": "Congratulations on reaching the final milestone of Introduction to Quantum Computing! You have progressed from basic classical bits to multi-qubit entanglement and quantum algorithms."},
            {"type": "text", "content": "In QUANTUMANIA, your workflow connects directly across subsystems:"},
            {"type": "bullet_list", "items": [
                "1. Study Curriculum: Master concepts in the lesson viewer.",
                "2. Construct Circuits: Drag and drop gates on the Phase 3 canvas.",
                "3. Simulate: Execute linear algebra on the Phase 4 deterministic simulator.",
                "4. Consult AI Tutor: Receive grounded Socratic explanations in Phase 5.",
                "5. Prove Mastery: Solve algorithm challenges and earn XP in Phase 6."
            ]},
            {"type": "callout", "variant": "tip", "content": "Course Completion: Marking this lesson complete completes all 5 modules! Check your updated course progress on the dashboard."}
        ],
        "content_markdown": "# From Circuit to Result\n\nSynthesize the complete quantum engineering workflow.",
        "initial_circuit_json": None,
        "interactive_meta_json": None
    }
]


def validate_curriculum_integrity() -> bool:
    """
    Validates curriculum data structures fail-fast during startup or tests.
    Enforces:
    - Exactly 1 course
    - Exactly 5 modules
    - Exactly 20 lessons
    - Unique IDs across all entities
    - Valid foreign keys
    - Non-empty titles, descriptions, content_blocks, and objectives
    """
    assert CURRICULUM_COURSE["id"] == "crs_intro_quantum"
    assert len(CURRICULUM_MODULES) == 5, f"Expected 5 modules, got {len(CURRICULUM_MODULES)}"
    assert len(CURRICULUM_LESSONS) == 20, f"Expected 20 lessons, got {len(CURRICULUM_LESSONS)}"

    course_id = CURRICULUM_COURSE["id"]
    module_ids = {m["id"] for m in CURRICULUM_MODULES}
    assert len(module_ids) == 5, "Duplicate module IDs detected"

    for m in CURRICULUM_MODULES:
        assert m["course_id"] == course_id, f"Module {m['id']} has invalid course_id"
        assert len(m["title"]) > 0
        assert len(m["slug"]) > 0

    lesson_ids = set()
    for l in CURRICULUM_LESSONS:
        assert l["id"] not in lesson_ids, f"Duplicate lesson ID {l['id']}"
        lesson_ids.add(l["id"])
        assert l["module_id"] in module_ids, f"Lesson {l['id']} belongs to unknown module {l['module_id']}"
        assert len(l["title"]) > 0, f"Lesson {l['id']} missing title"
        assert len(l["objectives"]) >= 2, f"Lesson {l['id']} must have at least 2 objectives"
        assert len(l["content_blocks"]) >= 3, f"Lesson {l['id']} must have at least 3 content blocks"
        assert l["estimated_minutes"] >= 5, f"Lesson {l['id']} must have estimated_minutes >= 5"

    return True
