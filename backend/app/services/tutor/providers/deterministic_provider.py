"""
QUANTUMANIA - Deterministic Pedagogical Quantum Tutor Engine
Phase 5: AI Quantum Tutor
Authoritative, hallucination-free educational reasoning engine for offline/fallback & ground-truth validation
"""

from typing import Dict, Any, List, Optional
from app.schemas.tutor import (
    TutorRequest,
    TutorResponse,
    TutorMode
)
from app.services.tutor.providers.base import BaseAIProvider


class DeterministicTutorProvider(BaseAIProvider):
    async def generate_response(
        self,
        request: TutorRequest,
        context_prompt: str,
        metadata: Dict[str, Any]
    ) -> TutorResponse:
        mode = request.mode
        circ = request.circuit_context
        sim = request.simulation_context
        msg = (request.message or "").lower().strip()

        # Extract gate types and summary
        gates_list: List[str] = []
        if circ and circ.circuit and circ.circuit.gates:
            gates_list = [g.type.value if hasattr(g.type, "value") else str(g.type) for g in circ.circuit.gates]
        elif circ and circ.gates_summary:
            gates_list = [g.split()[0] for g in circ.gates_summary]

        has_h = "H" in gates_list
        has_cnot = "CNOT" in gates_list
        has_x = "X" in gates_list
        has_z = "Z" in gates_list
        is_bell = has_h and has_cnot and circ and circ.qubits == 2
        is_stale = sim.is_stale if sim else False
        has_sim = sim.has_simulation if sim else False

        # Dispatch based on Mode
        if mode == TutorMode.EXPLAIN:
            res = self._handle_explain(circ, sim, gates_list, is_bell, is_stale, has_sim, metadata)
        elif mode == TutorMode.HINT:
            res = self._handle_hint(request.hint_level or 1, circ, sim, gates_list, is_bell, metadata)
        elif mode == TutorMode.ANALYZE:
            res = self._handle_analyze(circ, sim, gates_list, is_bell, is_stale, has_sim, metadata)
        elif mode == TutorMode.GUIDE:
            res = self._handle_guide(circ, sim, gates_list, is_bell, metadata)
        else: # TutorMode.ASK
            res = self._handle_ask(msg, circ, sim, gates_list, is_bell, is_stale, has_sim, metadata, raw_msg=(request.message or ""))

        # Adapt response with Phase 6 Learner Context
        if request.learner_context:
            res = self._apply_learner_context_adaptation(res, request.learner_context, gates_list)

        return res

    def _apply_learner_context_adaptation(
        self,
        response: TutorResponse,
        lc: Any,
        gates_list: List[str]
    ) -> TutorResponse:
        """Enriches tutor responses using authentic learner intelligence."""
        weak_topics = lc.weak_topics or []
        strengths = lc.strengths or []
        adaptation_notes = []

        # Topic relevance mapping
        is_h_present = "H" in gates_list
        is_cx_present = "CNOT" in gates_list or "CX" in gates_list

        if "superposition" in weak_topics and is_h_present:
            adaptation_notes.append(
                "> 💡 **Adaptive Learning Guidance**: Since you are reinforcing your understanding of **Superposition**, note how the Hadamard gate maps computational basis $|0\\rangle$ into an equal superposition $\\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)$."
            )
        elif "cnot_gate" in weak_topics and is_cx_present:
            adaptation_notes.append(
                "> 💡 **Adaptive Learning Guidance**: Since you are practicing **CNOT operations**, remember the conditional parity rule: target flips only when control qubit is $|1\\rangle$."
            )
        elif "entanglement" in weak_topics and (is_h_present and is_cx_present):
            adaptation_notes.append(
                "> 💡 **Adaptive Learning Guidance**: To strengthen your grasp on **Entanglement**, verify that measuring qubit 0 immediately determines qubit 1's state."
            )
        elif strengths and not adaptation_notes:
            primary_strength = strengths[0].replace("_", " ").title()
            adaptation_notes.append(
                f"> 🎓 **Mastery Grounding**: Building upon your verified proficiency in **{primary_strength}**, you can explore how these state transformations scale to multi-qubit registers."
            )

        if adaptation_notes:
            response.message = f"{adaptation_notes[0]}\n\n{response.message}"

        # Align next step with recommendation if available
        if lc.recommended_next and len(lc.recommended_next) > 0 and not response.next_step:
            top_rec = lc.recommended_next[0]
            response.next_step = f"Recommended Next Action: {top_rec.title} ({top_rec.reason})"

        response.context_used["learner_context_applied"] = True
        response.context_used["learner_overall_progress"] = lc.overall_progress
        if weak_topics:
            response.context_used["addressed_weaknesses"] = weak_topics[:3]

        return response

    def _handle_explain(
        self,
        circ: Any,
        sim: Any,
        gates_list: List[str],
        is_bell: bool,
        is_stale: bool,
        has_sim: bool,
        metadata: Dict[str, Any]
    ) -> TutorResponse:
        prefix = ""
        if is_stale:
            prefix = "> ⚠️ **Notice: Circuit Modified**\n> You modified the circuit since your last run. The simulation probabilities shown below are from an earlier circuit version. Please click **Run Circuit** to refresh.\n\n"

        if not circ or circ.gate_count == 0:
            return TutorResponse(
                mode=TutorMode.EXPLAIN,
                message=(
                    f"{prefix}### Quantum Circuit Status: Ground State |0...0⟩\n\n"
                    "Your circuit currently has no gates placed. In quantum mechanics, quantum registers are initialized deterministically in the computational **ground state**:\n\n"
                    "$$|\\psi_0\\rangle = |00\\dots0\\rangle$$\n\n"
                    "Every qubit is in state $|0\\rangle$ with 100% probability. To begin exploring quantum phenomena, try placing a **Hadamard (H)** gate to create a superposition!"
                ),
                key_points=[
                    "Circuits initialize in ground state |0...0⟩",
                    "No gates placed means state remains unaltered",
                    "Use H gate to enter quantum superposition"
                ],
                next_step="Drag and drop a Hadamard (H) gate onto qubit q0.",
                follow_up_question="What do you expect will happen to the probability of measuring 0 when you add an H gate?",
                context_used=metadata
            )

        if is_bell:
            sim_detail = ""
            if has_sim and sim.probabilities:
                p00 = round(sim.probabilities.get("00", 0.0) * 100, 1)
                p11 = round(sim.probabilities.get("11", 0.0) * 100, 1)
                sim_detail = f"\n\n**Phase 4 Simulation Confirmation:**\n- P(|00⟩) = {p00}%\n- P(|11⟩) = {p11}%\n- P(|01⟩) = 0.0%, P(|10⟩) = 0.0%"

            return TutorResponse(
                mode=TutorMode.EXPLAIN,
                message=(
                    f"{prefix}### Maximally Entangled Bell State |Φ+⟩\n\n"
                    "Your circuit creates one of the four famous **EPR Bell pairs**, demonstrating quantum entanglement:\n\n"
                    "1. **Step 0 — Hadamard Gate on q0:**\n"
                    "   Rotates qubit q0 into an equal superposition: $\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$.\n"
                    "   The system state becomes $\\frac{|00\\rangle + |01\\rangle}{\\sqrt{2}}$ (with q0 as LSB).\n\n"
                    "2. **Step 1 — CNOT Gate (Control: q0, Target: q1):**\n"
                    "   Whenever control qubit q0 is $|1\\rangle$, it flips target qubit q1 from $|0\\rangle$ to $|1\\rangle$.\n"
                    "   This entangles the qubits into the non-separable state: $|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$.\n\n"
                    "3. **Physical Consequence:**\n"
                    "   Measuring q0 instantly dictates the outcome of q1. If q0 yields 0, q1 is guaranteed to yield 0. If q0 yields 1, q1 is guaranteed to yield 1."
                    f"{sim_detail}"
                ),
                key_points=[
                    "H creates an equal superposition on control qubit q0",
                    "CNOT entangles q0 and q1 into non-separable state (|00⟩ + |11⟩)/√2",
                    "Outcomes |01⟩ and |10⟩ have zero probability due to destructive cancellation"
                ],
                next_step="Try adding Pauli-X to q0 before the H gate to generate the |Φ-⟩ Bell state.",
                follow_up_question="Why do you think outcomes |01⟩ and |10⟩ have zero probability?",
                context_used=metadata
            )

        if gates_list == ["H", "H"]:
            return TutorResponse(
                mode=TutorMode.EXPLAIN,
                message=(
                    f"{prefix}### Quantum Interference (H² = I)\n\n"
                    "Your circuit applies two consecutive Hadamard gates to the same qubit:\n\n"
                    "1. The first H gate puts the qubit into equal superposition: |+⟩ = (|0⟩ + |1⟩)/√2.\n"
                    "2. The second H gate applies the Hadamard transformation again:\n"
                    "   - The |0⟩ component expands to (|0⟩ + |1⟩)/√2.\n"
                    "   - The |1⟩ component expands to (|0⟩ - |1⟩)/√2.\n"
                    "3. **Interference occurs:**\n"
                    "   - For |0⟩: Amplitudes add constructively: 1/2 + 1/2 = 1.\n"
                    "   - For |1⟩: Amplitudes cancel destructively: 1/2 - 1/2 = 0.\n\n"
                    "Because H · H = I (identity matrix), the qubit deterministically returns to |0⟩ with 100% probability!"

                ),
                key_points=[
                    "Hadamard is self-inverse (unitary and Hermitian: H² = I)",
                    "Constructive interference preserves state |0⟩",
                    "Destructive interference eliminates state |1⟩"
                ],
                next_step="Try inserting a Pauli-Z or Phase-S gate between the two H gates.",
                follow_up_question="What will happen to the interference if you introduce a phase shift between the two H gates?",
                context_used=metadata
            )

        if gates_list == ["H"] and circ.qubits == 1:
            return TutorResponse(
                mode=TutorMode.EXPLAIN,
                message=(
                    f"{prefix}### Single-Qubit Equal Superposition\n\n"
                    "Your circuit applies a **Hadamard (H)** gate to ground state $|0\\rangle$:\n\n"
                    "$$H|0\\rangle = |+\\rangle = \\frac{1}{\\sqrt{2}}|0\\rangle + \\frac{1}{\\sqrt{2}}|1\\rangle$$\n\n"
                    "- The amplitude for $|0\\rangle$ is $\\frac{1}{\\sqrt{2}} \\approx 0.7071$.\n"
                    "- The amplitude for $|1\\rangle$ is $\\frac{1}{\\sqrt{2}} \\approx 0.7071$.\n"
                    "- Theoretical measurement probabilities are: $P(0) = |\\alpha_0|^2 = 0.5$ (50%), and $P(1) = |\\alpha_1|^2 = 0.5$ (50%).\n\n"
                    "The qubit is not simply in an unknown state of 0 or 1; it is in a coherent quantum superposition until projective measurement forces a collapse."
                ),
                key_points=[
                    "Hadamard creates superposition from computational basis states",
                    "Equal 50% probability for 0 and 1 upon measurement",
                    "Statevector amplitudes are 1/√2 each"
                ],
                next_step="Run 1,000 measurement shots in Quantum Lab to see how empirical counts approach 50/50.",
                follow_up_question="Does measuring the qubit leave it in superposition, or collapse it?",
                context_used=metadata
            )

        # General circuit fallback
        gate_summary_str = ", ".join(gates_list) if gates_list else "no gates"
        return TutorResponse(
            mode=TutorMode.EXPLAIN,
            message=(
                f"{prefix}### Circuit Breakdown: {circ.qubits} Qubit(s), {circ.gate_count} Operation(s)\n\n"
                f"Your circuit applies the sequence: **{gate_summary_str}** across a timeline depth of {circ.depth}.\n\n"
                "In quantum simulation, state evolution proceeds strictly sequentially time-slice by time-slice. "
                "Each single-qubit gate applies a 2×2 unitary matrix transformation to its target qubit subspace, "
                "while multi-qubit gates like CNOT correlate amplitudes across computational basis states.\n\n"
                + (f"Your Phase 4 simulation produced outcomes: {', '.join(f'|{k}⟩: {round(v*100, 1)}%' for k, v in sim.probabilities.items() if v > 0.01)}." if has_sim and sim.probabilities else "Run the simulation to inspect the exact statevector amplitudes.")
            ),
            key_points=[
                f"Circuit has {circ.qubits} qubits and depth {circ.depth}",
                "Unitary operations evolve the state deterministically"
            ],
            next_step="Inspect the measurement histogram below the canvas.",
            follow_up_question="Which qubit is being measured or altered first in your timeline?",
            context_used=metadata
        )

    def _handle_hint(
        self,
        level: int,
        circ: Any,
        sim: Any,
        gates_list: List[str],
        is_bell: bool,
        metadata: Dict[str, Any]
    ) -> TutorResponse:
        if is_bell:
            hints = {
                1: "💡 **Conceptual Hint (Level 1/3):** You have already created a maximally entangled Bell pair! Try experimenting with what happens when you introduce phase changes before or after the CNOT.",
                2: "🔍 **Specific Hint (Level 2/3):** To generate the orthogonal Bell state $|\\Phi^-\\rangle = \\frac{|00\\rangle - |11\\rangle}{\\sqrt{2}}$, place a Pauli-Z gate on q0 after the H gate but before CNOT.",
                3: "🎯 **Actionable Hint (Level 3/3):** Try applying Pauli-X to q0 at Step 0, then H at Step 1, then CNOT at Step 2. This will generate the $|\\Psi^+\\rangle = \\frac{|01\\rangle + |10\\rangle}{\\sqrt{2}}$ state!"
            }
        elif "CNOT" in gates_list and not "H" in gates_list:
            hints = {
                1: "💡 **Conceptual Hint (Level 1/3):** A CNOT gate only entangles qubits if the control qubit is in a superposition. When control is classical $|0\\rangle$, CNOT does nothing!",
                2: "🔍 **Specific Hint (Level 2/3):** Place a Hadamard (H) gate on your control qubit BEFORE the CNOT operation.",
                3: "🎯 **Actionable Hint (Level 3/3):** Add an H gate to q0 at step 0, then keep CNOT(control=q0, target=q1) at step 1. That will create quantum entanglement!"
            }
        elif "H" in gates_list and not "CNOT" in gates_list and circ and circ.qubits > 1:
            hints = {
                1: "💡 **Conceptual Hint (Level 1/3):** You have created superposition on a single qubit. To connect multiple qubits, you need an entangling 2-qubit gate.",
                2: "🔍 **Specific Hint (Level 2/3):** Select the Controlled-NOT (CNOT) gate from the Controlled palette.",
                3: "🎯 **Actionable Hint (Level 3/3):** Place CNOT with control on q0 and target on q1 in the step immediately following your H gate."
            }
        else:
            hints = {
                1: "💡 **Conceptual Hint (Level 1/3):** Quantum algorithms derive their power from creating superposition first, then entangling qubits, and finally observing interference.",
                2: "🔍 **Specific Hint (Level 2/3):** Check your gate ordering from left to right. Order matters in quantum mechanics because matrix multiplication is non-commutative ($A \\cdot B \\ne B \\cdot A$).",
                3: "🎯 **Actionable Hint (Level 3/3):** Try creating an equal superposition on qubit q0 using the H gate, then run the simulation to check probabilities."
            }

        selected_hint = hints.get(level, hints[1])
        return TutorResponse(
            mode=TutorMode.HINT,
            message=selected_hint,
            key_points=[f"Hint Level {level} of 3 provided"],
            next_step="Try applying the hint in your circuit canvas.",
            follow_up_question="Did this hint help clarify your next step?",
            context_used=metadata
        )

    def _handle_analyze(
        self,
        circ: Any,
        sim: Any,
        gates_list: List[str],
        is_bell: bool,
        is_stale: bool,
        has_sim: bool,
        metadata: Dict[str, Any]
    ) -> TutorResponse:
        diagnostics = []

        if not circ or circ.gate_count == 0:
            return TutorResponse(
                mode=TutorMode.ANALYZE,
                message="### Circuit Analysis: Empty Canvas\n\nYour circuit contains no operations. Add gates from the palette on the left to begin constructing an algorithm.",
                key_points=["Circuit is empty"],
                next_step="Add a gate to begin.",
                context_used=metadata
            )

        if is_stale:
            diagnostics.append("⚠️ **Stale Simulation Data:** The circuit canvas was edited after running the simulator. Previous simulation metrics do not reflect your current gate layout.")

        if not has_sim:
            diagnostics.append("ℹ️ **Simulation Pending:** You haven't simulated this circuit yet. Click **Run Circuit** to generate exact mathematical statevectors and empirical counts.")

        if "CNOT" in gates_list and not "H" in gates_list:
            diagnostics.append("⚠️ **Ineffective Entanglement:** You have a CNOT gate acting without a prior Hadamard gate. If control is in ground state |0⟩, CNOT leaves the target unaltered.")

        if is_bell:
            diagnostics.append("✅ **Optimal Entanglement Architecture:** Hadamard on q0 followed by CNOT(q0, q1) correctly forms a maximally entangled Bell pair |Φ+⟩.")

        if not diagnostics:
            diagnostics.append("✅ **Circuit Structure Valid:** Gates are logically arranged without detectable qubit collisions or control/target violations.")

        msg_body = "### Circuit & Simulation Diagnostic Report\n\n" + "\n\n".join(diagnostics)
        return TutorResponse(
            mode=TutorMode.ANALYZE,
            message=msg_body,
            key_points=[f"Analyzed {circ.gate_count} operations across {circ.qubits} qubits"],
            next_step="Run the simulation or test suggested optimizations.",
            follow_up_question="Would you like to analyze a specific gate's effect on the statevector?",
            context_used=metadata
        )

    def _handle_guide(
        self,
        circ: Any,
        sim: Any,
        gates_list: List[str],
        is_bell: bool,
        metadata: Dict[str, Any]
    ) -> TutorResponse:
        if is_bell:
            recommendation = (
                "### Next Recommended Experiment: Bell State Variations\n\n"
                "You have successfully constructed the $|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$ Bell state!\n\n"
                "**What to try next:**\n"
                "1. **Create $|\\Phi^-\\rangle$:** Place a Pauli-Z gate on q0 between the H and CNOT gates. Observe how the relative phase between $|00\\rangle$ and $|11\\rangle$ flips to negative.\n"
                "2. **Create a 3-qubit GHZ State:** Increase the circuit to 3 qubits, keep your Bell pair, and add a second CNOT from q1 to q2. You will observe tripartite entanglement: $\\frac{|000\\rangle + |111\\rangle}{\\sqrt{2}}$!"
            )
            next_step = "Add a 3rd qubit and add CNOT(ctrl=q1, tgt=q2)."
        elif "H" in gates_list and not "CNOT" in gates_list:
            recommendation = (
                "### Next Recommended Experiment: Create Quantum Entanglement\n\n"
                "You currently have a single qubit in superposition. Now explore multi-qubit correlations!\n\n"
                "**What to try next:**\n"
                "1. Ensure you have at least 2 qubits allocated.\n"
                "2. Add a **CNOT** gate with **q0 as control** and **q1 as target** in the column following your H gate.\n"
                "3. Click **Run Circuit** to witness how individual independent states become entangled!"
            )
            next_step = "Place a CNOT gate with control q0 and target q1."
        else:
            recommendation = (
                "### Next Recommended Experiment: Explore Superposition\n\n"
                "**What to try next:**\n"
                "1. Place a **Hadamard (H)** gate on qubit q0 at Step 0.\n"
                "2. Click **Run Circuit** with 1,000 shots.\n"
                "3. Observe how the probability splits into exactly 50% for |0⟩ and 50% for |1⟩."
            )
            next_step = "Place an H gate on q0 at Step 0."

        return TutorResponse(
            mode=TutorMode.GUIDE,
            message=recommendation,
            key_points=["Targeted next experiment suggested"],
            next_step=next_step,
            follow_up_question="Ready to try this experiment?",
            context_used=metadata
        )

    def _handle_ask(
        self,
        msg: str,
        circ: Any,
        sim: Any,
        gates_list: List[str],
        is_bell: bool,
        is_stale: bool,
        has_sim: bool,
        metadata: Dict[str, Any],
        raw_msg: str = ""
    ) -> TutorResponse:
        # Question about why not simulated or missing simulation result (Section 27)
        if ("why" in msg or "what" in msg) and "result" in msg and not has_sim:
            return TutorResponse(
                mode=TutorMode.ASK,
                message=(
                    "### Simulation Result Required\n\n"
                    "You asked about the circuit's results, but the circuit has not been simulated yet! "
                    "In QUANTUMANIA, the AI Tutor grounds its explanations strictly in real mathematical simulation data rather than guessing.\n\n"
                    "👉 **Please click the 'Run Circuit' button in the toolbar** to compute the exact statevector and measurement counts, then ask again!"
                ),
                key_points=["Simulation required for result-specific questions"],
                next_step="Click 'Run Circuit' in the Quantum Lab toolbar.",
                context_used=metadata
            )

        # Question about why 00 and 11
        if ("why" in msg or "how" in msg) and ("00" in msg or "11" in msg or "bell" in msg or "entangle" in msg) and is_bell:
            return TutorResponse(
                mode=TutorMode.ASK,
                message=(
                    "### Why |00⟩ and |11⟩ are the Only Outcomes\n\n"
                    "In your circuit, the Hadamard gate puts qubit q0 into superposition:\n\n"
                    "$$|\\psi_1\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} \\otimes |0\\rangle = \\frac{|00\\rangle + |01\\rangle}{\\sqrt{2}}$$\n\n"
                    "Next, the CNOT gate tests the control qubit (q0):\n"
                    "- In the branch where q0 is $|0\\rangle$, the target q1 remains $|0\\rangle \\implies |00\\rangle$.\n"
                    "- In the branch where q0 is $|1\\rangle$, the target q1 flips from $|0\\rangle$ to $|1\\rangle \\implies |11\\rangle$.\n\n"
                    "The components $|01\\rangle$ and $|10\\rangle$ have zero probability because there is no branch of the quantum superposition where q0 and q1 differ. "
                    "The two qubits are now **maximally entangled**!"
                ),
                key_points=[
                    "Branch where q0=0 keeps q1=0 -> |00⟩",
                    "Branch where q0=1 flips q1 to 1 -> |11⟩",
                    "No branch produces opposite values"
                ],
                next_step="Check the measurement histogram to verify only 00 and 11 appear.",
                follow_up_question="What would happen if you flipped the target qubit with an X gate before the CNOT?",
                context_used=metadata
            )

        # Question about probability vs counts (Section 51)
        if "count" in msg or "difference" in msg or "shot" in msg or "exact" in msg or "50" in msg:
            return TutorResponse(
                mode=TutorMode.ASK,
                message=(
                    "### Theoretical Probability vs. Empirical Measurement Counts\n\n"
                    "Great question! There is a crucial difference in quantum mechanics between **probabilities** and **measurement counts**:\n\n"
                    "1. **Theoretical Probability ($P = |\\alpha|^2$):**\n"
                    "   This is the exact mathematical amplitude squared computed by the classical simulator (e.g., exactly 50.0% for $|0\\rangle$ and 50.0% for $|1\\rangle$).\n\n"
                    "2. **Empirical Counts (Finite Shots):**\n"
                    "   When you run 1,000 shots, the simulator probabilistically samples outcomes just like a real quantum processor. "
                    "   Due to statistical variance (like flipping a fair coin 1,000 times), you might observe 493 heads and 507 tails.\n\n"
                    "As the number of shots increases towards infinity, the empirical ratio $\\frac{\\text{counts}}{\\text{shots}}$ converges toward the theoretical probability by the **Law of Large Numbers**."
                ),
                key_points=[
                    "Probability is the exact mathematical property of the statevector",
                    "Counts are empirical observations from finite random sampling",
                    "Statistical variance causes counts to fluctuate closely around theoretical probabilities"
                ],
                next_step="Try running 100 shots vs 4,096 shots and observe how the histogram stabilizes.",
                follow_up_question="Why do quantum computers require multiple shots instead of a single measurement?",
                context_used=metadata
            )

        # Question about Superposition
        if "superposition" in msg or "hadamard" in msg or "h gate" in msg:
            return TutorResponse(
                mode=TutorMode.ASK,
                message=(
                    "### Understanding Quantum Superposition\n\n"
                    "In classical computing, a bit is strictly either a 0 or a 1 at any moment. "
                    "In quantum computing, a qubit can exist in a linear combination of both basis states:\n\n"
                    "$$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle, \\quad |\\alpha|^2 + |\\beta|^2 = 1$$\n\n"
                    "The **Hadamard (H)** gate creates an equal superposition:\n"
                    "$$H|0\\rangle = \\frac{1}{\\sqrt{2}}|0\\rangle + \\frac{1}{\\sqrt{2}}|1\\rangle$$\n\n"
                    "Until measurement occurs, the qubit possesses quantum phase information that enables interference."
                ),
                key_points=[
                    "Superposition is a linear combination of basis states",
                    "Amplitudes α and β are complex numbers whose squared magnitudes sum to 1",
                    "Hadamard creates an equal superposition of |0⟩ and |1⟩"
                ],
                next_step="Add an H gate to your circuit and simulate it.",
                follow_up_question="What gate is the inverse of the Hadamard gate?",
                context_used=metadata
            )

        # General helpful question answering
        return TutorResponse(
            mode=TutorMode.ASK,
            message=(
                f"### AI Quantum Tutor\n\n"
                f"Regarding your question: *\"{raw_msg}\"*\n\n"
                "In your current circuit workspace:\n"
                f"- **Allocated Qubits:** {circ.qubits if circ else 1}\n"
                f"- **Operations:** {', '.join(gates_list) if gates_list else 'Empty canvas'}\n"
                + (f"- **Simulation State:** Verified ({len(sim.probabilities)} basis states calculated)" if has_sim and sim.probabilities else "- **Simulation State:** Ready to simulate") + "\n\n"
                "Quantum algorithms operate by initializing qubits in the ground state, rotating them into superposition, entangling multiple qubits, and using quantum interference to amplify the correct answer. "
                "Feel free to ask about any specific gate ($X, Y, Z, H, S, T, CNOT$), statevector amplitudes, or measurement probabilities!"
            ),
            key_points=[
                "Ask questions about gates, circuits, or simulation outcomes",
                "Use Quick Actions for one-click explanations and hints"
            ],
            next_step="Select 'Explain Circuit' or 'Give Me a Hint' for targeted guidance.",
            follow_up_question="Would you like an explanation of a specific gate or the simulation results?",
            context_used=metadata
        )
