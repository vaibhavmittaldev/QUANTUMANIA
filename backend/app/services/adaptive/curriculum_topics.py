"""
QUANTUMANIA - Curriculum Topics and Knowledge Graph
Phase 6: Adaptive Learning & Learner Intelligence
Canonical mapping of quantum concepts, prerequisites, and associated circuit operations
"""

from typing import Dict, List, Any

CURRICULUM_TOPICS: Dict[str, Dict[str, Any]] = {
    "quantum_foundations": {
        "topic_id": "quantum_foundations",
        "title": "Quantum Computing Foundations",
        "module_id": "mod_foundations",
        "module_title": "Module 1: Foundations",
        "lesson_id": "les_01_what_is_qc",
        "prerequisites": [],
        "associated_gates": [],
        "practice_template_id": None,
        "difficulty": "beginner"
    },
    "qubits": {
        "topic_id": "qubits",
        "title": "Classical Bits vs Qubits",
        "module_id": "mod_foundations",
        "module_title": "Module 1: Foundations",
        "lesson_id": "les_02_bits_vs_qubits",
        "prerequisites": ["quantum_foundations"],
        "associated_gates": ["X"],
        "practice_template_id": None,
        "difficulty": "beginner"
    },
    "superposition": {
        "topic_id": "superposition",
        "title": "The Superposition Principle",
        "module_id": "mod_foundations",
        "module_title": "Module 1: Foundations",
        "lesson_id": "les_03_superposition",
        "prerequisites": ["qubits"],
        "associated_gates": ["H"],
        "practice_template_id": "superposition_single",
        "difficulty": "beginner"
    },
    "measurement": {
        "topic_id": "measurement",
        "title": "Quantum Measurement & Collapse",
        "module_id": "mod_foundations",
        "module_title": "Module 1: Foundations",
        "lesson_id": "les_04_measurement",
        "prerequisites": ["superposition"],
        "associated_gates": ["MEASURE"],
        "practice_template_id": "superposition_single",
        "difficulty": "beginner"
    },
    "bloch_sphere": {
        "topic_id": "bloch_sphere",
        "title": "Geometric View: The Bloch Sphere",
        "module_id": "mod_states_gates",
        "module_title": "Module 2: States & Gates",
        "lesson_id": "les_05_bloch_sphere",
        "prerequisites": ["superposition", "measurement"],
        "associated_gates": ["X", "Y", "Z", "H"],
        "practice_template_id": "superposition_single",
        "difficulty": "beginner"
    },
    "pauli_gates": {
        "topic_id": "pauli_gates",
        "title": "Pauli Quantum Logic Gates (X, Y, Z)",
        "module_id": "mod_states_gates",
        "module_title": "Module 2: States & Gates",
        "lesson_id": "les_06_pauli_gates",
        "prerequisites": ["qubits", "bloch_sphere"],
        "associated_gates": ["X", "Y", "Z"],
        "practice_template_id": None,
        "difficulty": "beginner"
    },
    "hadamard_gate": {
        "topic_id": "hadamard_gate",
        "title": "The Hadamard Gate & Superposition",
        "module_id": "mod_states_gates",
        "module_title": "Module 2: States & Gates",
        "lesson_id": "les_07_hadamard",
        "prerequisites": ["superposition", "pauli_gates"],
        "associated_gates": ["H"],
        "practice_template_id": "superposition_single",
        "difficulty": "beginner"
    },
    "phase_gates": {
        "topic_id": "phase_gates",
        "title": "Phase & Rotation Gates (S, T, Rz)",
        "module_id": "mod_states_gates",
        "module_title": "Module 2: States & Gates",
        "lesson_id": "les_08_phase_gates",
        "prerequisites": ["pauli_gates", "bloch_sphere"],
        "associated_gates": ["S", "T", "RZ", "RX", "RY"],
        "practice_template_id": None,
        "difficulty": "intermediate"
    },
    "multi_qubit_systems": {
        "topic_id": "multi_qubit_systems",
        "title": "Multi-Qubit Systems & Tensor Products",
        "module_id": "mod_multi_qubit",
        "module_title": "Module 3: Multi-Qubit Computing",
        "lesson_id": "les_09_multi_qubit_states",
        "prerequisites": ["qubits", "hadamard_gate"],
        "associated_gates": ["H"],
        "practice_template_id": None,
        "difficulty": "intermediate"
    },
    "cnot_gate": {
        "topic_id": "cnot_gate",
        "title": "The Controlled-NOT (CNOT) Gate",
        "module_id": "mod_multi_qubit",
        "module_title": "Module 3: Multi-Qubit Computing",
        "lesson_id": "les_10_cnot_gate",
        "prerequisites": ["multi_qubit_systems", "pauli_gates"],
        "associated_gates": ["CX"],
        "practice_template_id": "bell_state",
        "difficulty": "intermediate"
    },
    "entanglement": {
        "topic_id": "entanglement",
        "title": "Quantum Entanglement & Bell States",
        "module_id": "mod_multi_qubit",
        "module_title": "Module 3: Multi-Qubit Computing",
        "lesson_id": "les_11_entanglement",
        "prerequisites": ["cnot_gate", "hadamard_gate"],
        "associated_gates": ["H", "CX"],
        "practice_template_id": "bell_state",
        "difficulty": "intermediate"
    },
    "multi_qubit_gates": {
        "topic_id": "multi_qubit_gates",
        "title": "Advanced Multi-Qubit Gates (SWAP & Toffoli)",
        "module_id": "mod_multi_qubit",
        "module_title": "Module 3: Multi-Qubit Computing",
        "lesson_id": "les_12_swap_toffoli",
        "prerequisites": ["cnot_gate"],
        "associated_gates": ["SWAP", "CCX"],
        "practice_template_id": "ghz_state",
        "difficulty": "intermediate"
    },
    "quantum_speedup": {
        "topic_id": "quantum_speedup",
        "title": "Understanding Quantum Speedup",
        "module_id": "mod_algorithms",
        "module_title": "Module 4: Quantum Algorithms",
        "lesson_id": "les_13_quantum_speedup",
        "prerequisites": ["superposition", "entanglement"],
        "associated_gates": ["H", "CX"],
        "practice_template_id": None,
        "difficulty": "advanced"
    },
    "deutsch_algorithm": {
        "topic_id": "deutsch_algorithm",
        "title": "Deutsch's Algorithm & Phase Kickback",
        "module_id": "mod_algorithms",
        "module_title": "Module 4: Quantum Algorithms",
        "lesson_id": "les_14_deutsch",
        "prerequisites": ["quantum_speedup", "hadamard_gate"],
        "associated_gates": ["H", "X", "CX"],
        "practice_template_id": "deutsch_jozsa_2qubit",
        "difficulty": "advanced"
    },
    "grovers_algorithm": {
        "topic_id": "grovers_algorithm",
        "title": "Grover's Search Algorithm",
        "module_id": "mod_algorithms",
        "module_title": "Module 4: Quantum Algorithms",
        "lesson_id": "les_15_grover",
        "prerequisites": ["deutsch_algorithm", "entanglement"],
        "associated_gates": ["H", "X", "CZ", "CCX"],
        "practice_template_id": "grover_2qubit",
        "difficulty": "advanced"
    },
    "quantum_fourier_transform": {
        "topic_id": "quantum_fourier_transform",
        "title": "Quantum Fourier Transform (QFT)",
        "module_id": "mod_algorithms",
        "module_title": "Module 4: Quantum Algorithms",
        "lesson_id": "les_16_qft",
        "prerequisites": ["grovers_algorithm", "phase_gates"],
        "associated_gates": ["H", "SWAP", "RZ"],
        "practice_template_id": "quantum_teleportation",
        "difficulty": "advanced"
    },
    "qiskit_programming": {
        "topic_id": "qiskit_programming",
        "title": "Introduction to Qiskit Circuit Programming",
        "module_id": "mod_programming",
        "module_title": "Module 5: Quantum Programming",
        "lesson_id": "les_17_qiskit_intro",
        "prerequisites": ["qubits", "hadamard_gate"],
        "associated_gates": ["H", "CX"],
        "practice_template_id": None,
        "difficulty": "intermediate"
    },
    "circuit_simulation": {
        "topic_id": "circuit_simulation",
        "title": "Simulating & Executing Quantum Circuits",
        "module_id": "mod_programming",
        "module_title": "Module 5: Quantum Programming",
        "lesson_id": "les_18_running_circuits",
        "prerequisites": ["qiskit_programming", "cnot_gate"],
        "associated_gates": ["H", "CX", "MEASURE"],
        "practice_template_id": "bell_state",
        "difficulty": "intermediate"
    },
    "measurement_statistics": {
        "topic_id": "measurement_statistics",
        "title": "Measurement & Statistical Analysis",
        "module_id": "mod_programming",
        "module_title": "Module 5: Quantum Programming",
        "lesson_id": "les_19_measurement_stats",
        "prerequisites": ["circuit_simulation", "measurement"],
        "associated_gates": ["MEASURE"],
        "practice_template_id": "bell_state",
        "difficulty": "intermediate"
    },
    "nisq_hardware": {
        "topic_id": "nisq_hardware",
        "title": "Real Hardware, Noise & NISQ Era",
        "module_id": "mod_programming",
        "module_title": "Module 5: Quantum Programming",
        "lesson_id": "les_20_hardware_noise",
        "prerequisites": ["measurement_statistics"],
        "associated_gates": [],
        "practice_template_id": None,
        "difficulty": "advanced"
    }
}

# Reverse lookup from lesson_id to topic_id
LESSON_TO_TOPIC_MAP = {v["lesson_id"]: k for k, v in CURRICULUM_TOPICS.items()}

# Lookup from gate type to topic_ids
GATE_TO_TOPICS_MAP: Dict[str, List[str]] = {}
for t_id, data in CURRICULUM_TOPICS.items():
    for gate in data["associated_gates"]:
        GATE_TO_TOPICS_MAP.setdefault(gate.upper(), []).append(t_id)


def get_topic_for_lesson(lesson_id: str) -> str:
    """Returns the associated topic_id for a given lesson_id, or fallback."""
    return LESSON_TO_TOPIC_MAP.get(lesson_id, "quantum_foundations")


def get_topic_for_gates(gates: List[str]) -> List[str]:
    """Finds topics relevant to a list of gates placed in a circuit."""
    matched = set()
    for g in gates:
        g_clean = g.upper().strip()
        if g_clean in GATE_TO_TOPICS_MAP:
            matched.update(GATE_TO_TOPICS_MAP[g_clean])
    return list(matched)
