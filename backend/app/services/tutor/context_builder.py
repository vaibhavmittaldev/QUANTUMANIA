"""
QUANTUMANIA - AI Quantum Tutor Context Builder
Phase 5: AI Quantum Tutor
Assembles deterministic, privacy-preserving, bounded context from Phase 2, 3, and 4
"""

from typing import Dict, Any, Tuple
from app.schemas.tutor import (
    TutorRequest,
    TutorMode
)
from app.core.config import settings


class ContextBuilder:
    @staticmethod
    def build_context(request: TutorRequest) -> Tuple[str, Dict[str, Any]]:
        """
        Builds a human-readable prompt context and structured metadata dict.
        Returns:
            (context_prompt_text, context_used_metadata)
        """
        sections = []
        metadata: Dict[str, Any] = {
            "mode": request.mode.value,
            "has_lesson": False,
            "has_circuit": False,
            "has_simulation": False,
            "is_stale": False
        }

        # 1. Lesson Context (Phase 2)
        if request.lesson_context:
            les = request.lesson_context
            metadata["has_lesson"] = True
            metadata["lesson_title"] = les.title or les.lesson_id or "General Lab"
            les_text = [f"### LEARNING CURRICULUM CONTEXT:"]
            if les.title:
                les_text.append(f"- Lesson Title: {les.title}")
            if les.topic:
                les_text.append(f"- Quantum Topic: {les.topic}")
            if les.difficulty:
                les_text.append(f"- Learner Level: {les.difficulty}")
            if les.objectives:
                les_text.append(f"- Target Learning Objectives: {', '.join(les.objectives)}")
            sections.append("\n".join(les_text))

        # 2. Circuit Context (Phase 3)
        if request.circuit_context:
            circ = request.circuit_context
            metadata["has_circuit"] = True
            metadata["qubits"] = circ.qubits
            metadata["gate_count"] = circ.gate_count
            metadata["depth"] = circ.depth

            circ_text = [
                f"### CURRENT QUANTUM CIRCUIT (Canonical Phase 3):",
                f"- Allocated Qubits: {circ.qubits}",
                f"- Time-Slice Depth: {circ.depth}",
                f"- Total Gate Count: {circ.gate_count}"
            ]
            if circ.gates_summary:
                circ_text.append("- Gate Execution Timeline:")
                for g_desc in circ.gates_summary[:30]:
                    circ_text.append(f"    * {g_desc}")
            elif circ.circuit and circ.circuit.gates:
                circ_text.append("- Gates:")
                sorted_gates = sorted(circ.circuit.gates, key=lambda g: (g.step, g.target or 0))
                for g in sorted_gates[:30]:
                    tgt = f"q{g.target}" if g.target is not None else f"q{g.targets}"
                    ctrl = f" (ctrl=q{g.control})" if g.control is not None else ""
                    circ_text.append(f"    * Step {g.step}: {g.type.value if hasattr(g.type, 'value') else g.type} on {tgt}{ctrl}")
            else:
                circ_text.append("- Canvas Status: Empty circuit (no gates placed yet)")

            sections.append("\n".join(circ_text))

        # 3. Simulation Context (Phase 4)
        if request.simulation_context:
            sim = request.simulation_context
            metadata["has_simulation"] = sim.has_simulation
            metadata["is_stale"] = sim.is_stale

            sim_text = [f"### SIMULATION RESULTS (Authoritative Source: Phase 4 Classical Statevector Simulator):"]
            if not sim.has_simulation:
                sim_text.append("- Status: Circuit has NOT been simulated yet.")
                sim_text.append("- Instruction: Advise learner that running simulation generates authoritative state probabilities.")
            else:
                if sim.is_stale:
                    sim_text.append("⚠ NOTICE: The circuit was modified after the last simulation run.")
                    sim_text.append("The results below correspond to the PREVIOUS circuit state and are STALE.")
                else:
                    sim_text.append("- Status: Up to date (matches current circuit state).")

                if sim.shots:
                    sim_text.append(f"- Sampling Shots: {sim.shots}")

                if sim.probabilities:
                    prob_entries = [f"|{b}⟩: {round(p * 100, 2)}%" for b, p in sim.probabilities.items() if p > 0.001]
                    if prob_entries:
                        sim_text.append(f"- Non-Zero Basis Probabilities: {', '.join(prob_entries)}")
                    else:
                        sim_text.append("- Probabilities: All basis amplitudes near 0")

                if sim.counts:
                    count_entries = [f"|{b}⟩: {c}" for b, c in sim.counts.items() if c > 0]
                    if count_entries:
                        sim_text.append(f"- Empirical Measurement Counts: {', '.join(count_entries[:10])}")

                if sim.bloch_vectors:
                    b_strs = [f"q{bv.get('qubit')}: (x={bv.get('x')}, y={bv.get('y')}, z={bv.get('z')})" for bv in sim.bloch_vectors]
                    sim_text.append(f"- Reduced Bloch Coordinates: {'; '.join(b_strs)}")

            sections.append("\n".join(sim_text))

        # 4. Phase 6 Learner Model Context
        if request.learner_context:
            lc = request.learner_context
            metadata["has_learner_context"] = True
            metadata["overall_progress"] = lc.overall_progress
            metadata["weak_topics"] = lc.weak_topics or []
            metadata["strengths"] = lc.strengths or []

            lc_text = ["### PHASE 6 LEARNER MODEL & ADAPTIVE INTELLIGENCE:"]
            lc_text.append(f"- Curriculum Progress: {lc.overall_progress}% completed")
            if lc.current_topic:
                lc_text.append(f"- Active Topic Focus: {lc.current_topic}")
            if lc.strengths:
                lc_text.append(f"- Demonstrated Strengths: {', '.join(lc.strengths)}")
            if lc.weak_topics:
                lc_text.append(f"- Topics Needing Reinforcement: {', '.join(lc.weak_topics)}")
            if lc.topic_mastery:
                mastery_strs = [f"{tm.topic_title}: {tm.score}% ({tm.level})" for tm in lc.topic_mastery[:5]]
                lc_text.append(f"- Key Topic Masteries: {'; '.join(mastery_strs)}")
            if lc.recommended_next:
                rec_titles = [f"'{r.title}'" for r in lc.recommended_next[:2]]
                lc_text.append(f"- Recommended Next Actions: {', '.join(rec_titles)}")

            lc_text.append(
                "- Pedagogical Directives: Adapt explanations to the learner's verified mastery level. "
                "If the learner is weak in foundational concepts (e.g. Superposition or Qubits), prioritize gentle, intuitive explanations with analogies. "
                "If they have strong mastery, provide advanced insights and deeper mathematical formalism."
            )
            sections.append("\n".join(lc_text))

        # 5. Mode-Specific Directive
        mode = request.mode
        mode_directives = {
            TutorMode.EXPLAIN: "Provide a comprehensive pedagogical breakdown of this quantum circuit and state transformations.",
            TutorMode.HINT: f"Provide Progressive Hint (Level {request.hint_level} of 3). Do not reveal the full solution immediately.",
            TutorMode.ASK: "Answer the learner's specific question using the circuit and simulation context.",
            TutorMode.GUIDE: "Recommend the single best next action, gate placement, or experiment the learner should try.",
            TutorMode.ANALYZE: "Analyze the circuit for potential bugs, misconceptions, or unexpected probabilities."
        }
        sections.append(f"### TUTOR MODE DIRECTIVE ({mode.value.upper()}):\n{mode_directives.get(mode, 'Assist the learner with quantum computing.')}")

        # 6. User Message
        if request.message:
            sections.append(f"### LEARNER QUESTION / INPUT:\n\"{request.message.strip()}\"")

        context_prompt = "\n\n".join(sections)
        return context_prompt, metadata
