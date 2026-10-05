"""
QUANTUMANIA - Quantum Lab Practice & Validation Service
Validates practical circuit challenges, enforces pedagogical constraints,
and persists student progress into the authoritative learning system.
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.models.user import User, Profile
from app.db.models.learning import Lesson, LabProblem, LabProgressRecord
from app.schemas.learning import (
    LabProblemSummary,
    LabProblemDetail,
    LabValidationCheckResult,
    LabValidationResponse
)
from app.services.lab_problem_data import LAB_PROBLEMS_DATA
from app.core.exceptions import NotFoundException


class LabService:
    @staticmethod
    def seed_lab_problems_if_needed(db: Session):
        """Seeds canonical lab problems for curriculum lessons if not present."""
        legacy = db.query(LabProblem).filter(LabProblem.id == "lab_bell_01").first()
        if legacy:
            target = db.query(LabProblem).filter(LabProblem.id == "lab_bell_state_01").first()
            if not target:
                legacy.id = "lab_bell_state_01"
            else:
                db.delete(legacy)
            db.commit()

        for p_data in LAB_PROBLEMS_DATA:
            existing = db.query(LabProblem).filter(LabProblem.id == p_data["id"]).first()
            if not existing:
                problem = LabProblem(
                    id=p_data["id"],
                    lesson_id=p_data["lesson_id"],
                    topic_id=p_data["topic_id"],
                    title=p_data["title"],
                    description=p_data["description"],
                    objective=p_data["objective"],
                    difficulty=p_data["difficulty"],
                    instructions_json=p_data["instructions"],
                    starter_circuit_json=p_data.get("starter_circuit_json"),
                    template_id=p_data.get("template_id"),
                    required_gates_json=p_data.get("required_gates", []),
                    validation_rules_json=p_data["validation_rules"],
                    hints_json=p_data["hints"],
                    success_criteria=p_data["success_criteria"],
                    explanation=p_data["explanation"],
                    estimated_minutes=p_data.get("estimated_minutes", 10),
                    display_order=p_data.get("display_order", 1),
                    xp_reward=p_data.get("xp_reward", 50)
                )
                db.add(problem)
            else:
                # Update content if existing
                existing.title = p_data["title"]
                existing.description = p_data["description"]
                existing.objective = p_data["objective"]
                existing.instructions_json = p_data["instructions"]
                existing.starter_circuit_json = p_data.get("starter_circuit_json")
                existing.template_id = p_data.get("template_id")
                existing.required_gates_json = p_data.get("required_gates", [])
                existing.validation_rules_json = p_data["validation_rules"]
                existing.hints_json = p_data["hints"]
                existing.success_criteria = p_data["success_criteria"]
                existing.explanation = p_data["explanation"]
                existing.xp_reward = p_data.get("xp_reward", 50)
        db.commit()

    @staticmethod
    def get_lab_problems_for_lesson(
        db: Session,
        lesson_id: str,
        user: Optional[User] = None
    ) -> List[LabProblemSummary]:
        """Returns all practical lab challenges mapped to a lesson."""
        problems = (
            db.query(LabProblem)
            .filter(LabProblem.lesson_id == lesson_id)
            .order_by(LabProblem.display_order)
            .all()
        )

        completed_ids = set()
        if user:
            records = (
                db.query(LabProgressRecord.lab_problem_id)
                .filter(
                    LabProgressRecord.user_id == user.id,
                    LabProgressRecord.is_completed == True
                )
                .all()
            )
            completed_ids = {r[0] for r in records}

        return [
            LabProblemSummary(
                id=p.id,
                lesson_id=p.lesson_id,
                topic_id=p.topic_id,
                title=p.title,
                description=p.description,
                objective=p.objective,
                difficulty=p.difficulty,
                estimated_minutes=p.estimated_minutes,
                display_order=p.display_order,
                xp_reward=p.xp_reward,
                template_id=p.template_id,
                is_completed=p.id in completed_ids
            )
            for p in problems
        ]

    @staticmethod
    def get_lab_problem_detail(
        db: Session,
        problem_id: str,
        user: Optional[User] = None
    ) -> LabProblemDetail:
        """Returns comprehensive lab problem specification with starter circuit and hints."""
        p = db.query(LabProblem).filter(LabProblem.id == problem_id).first()
        if not p and problem_id == "lab_bell_01":
            p = db.query(LabProblem).filter(LabProblem.id == "lab_bell_state_01").first()
        elif not p and problem_id == "lab_bell_state_01":
            p = db.query(LabProblem).filter(LabProblem.id == "lab_bell_01").first()
        if not p:
            raise NotFoundException(f"Lab problem '{problem_id}' not found.")

        is_completed = False
        if user:
            rec = (
                db.query(LabProgressRecord)
                .filter(
                    LabProgressRecord.user_id == user.id,
                    LabProgressRecord.lab_problem_id == p.id,
                    LabProgressRecord.is_completed == True
                )
                .first()
            )
            is_completed = rec is not None

        return LabProblemDetail(
            id=p.id,
            lesson_id=p.lesson_id,
            topic_id=p.topic_id,
            title=p.title,
            description=p.description,
            objective=p.objective,
            difficulty=p.difficulty,
            estimated_minutes=p.estimated_minutes,
            display_order=p.display_order,
            xp_reward=p.xp_reward,
            template_id=p.template_id,
            is_completed=is_completed,
            instructions=p.instructions_json or [],
            starter_circuit=p.starter_circuit_json,
            starter_circuit_data=p.starter_circuit_json,
            required_gates=p.required_gates_json or [],
            validation_rules=p.validation_rules_json or {},
            hints=p.hints_json or [],
            success_criteria=p.success_criteria,
            explanation=p.explanation
        )

    @classmethod
    def validate_lab_submission(
        cls,
        db: Session,
        problem_id: str,
        circuit_data: Dict[str, Any],
        simulation_result: Optional[Dict[str, Any]] = None,
        user: Optional[User] = None
    ) -> LabValidationResponse:
        """
        Evaluates learner circuit against pedagogical validation rules.
        Verifies gate placements, register sizes, and empirical/statevector distributions.
        Records persistent progress and awards XP if passed.
        """
        problem = db.query(LabProblem).filter(LabProblem.id == problem_id).first()
        if not problem and problem_id == "lab_bell_01":
            problem = db.query(LabProblem).filter(LabProblem.id == "lab_bell_state_01").first()
        elif not problem and problem_id == "lab_bell_state_01":
            problem = db.query(LabProblem).filter(LabProblem.id == "lab_bell_01").first()
        if not problem:
            raise NotFoundException(f"Lab problem '{problem_id}' not found.")

        rules = problem.validation_rules_json or {}
        checks: List[LabValidationCheckResult] = []

        # 1. Wire count check
        qubits = circuit_data.get("qubits", 0)
        min_qubits = rules.get("min_qubits", 1)
        if qubits >= min_qubits:
            msg = f"Allocated {qubits} qubit(s) satisfies requirement (min: {min_qubits})."
            checks.append(LabValidationCheckResult(
                name="Qubit Allocation",
                passed=True,
                message=msg,
                details=msg
            ))
        else:
            msg = f"Circuit allocates {qubits} qubit(s), but {min_qubits} qubit(s) required."
            checks.append(LabValidationCheckResult(
                name="Qubit Allocation",
                passed=False,
                message=msg,
                details=msg
            ))

        # 2. Gate count and required gate types
        gates = circuit_data.get("gates", [])
        gate_types = [g.get("type", "").upper() for g in gates if isinstance(g, dict)]

        min_gates = rules.get("min_gate_count", 1)
        if len(gates) >= min_gates:
            msg = f"Circuit has {len(gates)} operation(s)."
            checks.append(LabValidationCheckResult(
                name="Gate Operations Depth",
                passed=True,
                message=msg,
                details=msg
            ))
        else:
            msg = f"At least {min_gates} gate operation(s) required on the circuit."
            checks.append(LabValidationCheckResult(
                name="Gate Operations Depth",
                passed=False,
                message=msg,
                details=msg
            ))

        required_types = rules.get("required_gate_types", [])
        for req_g in required_types:
            req_upper = req_g.upper()
            # Handle aliases: CNOT / CX
            found = False
            if req_upper in ("CNOT", "CX"):
                found = ("CNOT" in gate_types) or ("CX" in gate_types)
            else:
                found = req_upper in gate_types

            if found:
                msg = f"Gate '{req_g}' is correctly included in the circuit."
                checks.append(LabValidationCheckResult(
                    name=f"Required Gate: {req_g}",
                    passed=True,
                    message=msg,
                    details=msg
                ))
            else:
                msg = f"Missing required gate '{req_g}' on the circuit."
                checks.append(LabValidationCheckResult(
                    name=f"Required Gate: {req_g}",
                    passed=False,
                    message=msg,
                    details=msg
                ))

        # 3. Probabilistic & Statevector checks
        probabilities: Dict[str, float] = {}
        if simulation_result:
            if "probabilities" in simulation_result and isinstance(simulation_result["probabilities"], dict):
                probabilities = simulation_result["probabilities"]
            elif "counts" in simulation_result and isinstance(simulation_result["counts"], dict):
                counts = simulation_result["counts"]
                total = sum(counts.values()) or 1
                probabilities = {k: v / total for k, v in counts.items()}

        target_states = rules.get("target_states", {})
        tolerance = rules.get("tolerance", 0.08)

        if target_states and probabilities:
            state_match = True
            mismatch_details = []

            for state_key, target_prob in target_states.items():
                measured_prob = probabilities.get(state_key, 0.0)
                diff = abs(measured_prob - target_prob)
                if diff > tolerance:
                    state_match = False
                    mismatch_details.append(
                        f"State |{state_key}⟩ has observed probability {measured_prob:.2f} (expected {target_prob:.2f} ± {tolerance:.2f})"
                    )

            # Check forbidden states (must be < tolerance)
            forbidden = rules.get("forbidden_states", [])
            for f_state in forbidden:
                f_prob = probabilities.get(f_state, 0.0)
                if f_prob > tolerance:
                    state_match = False
                    mismatch_details.append(
                        f"Forbidden state |{f_state}⟩ appeared with probability {f_prob:.2f} (should be ~0.00)"
                    )

            if state_match:
                msg = "Observed measurement distribution satisfies target Born rule probabilities within tolerance."
                checks.append(LabValidationCheckResult(
                    name="Quantum State & Measurement Distribution",
                    passed=True,
                    message=msg,
                    details=msg
                ))
            else:
                msg = f"Distribution mismatch: {'; '.join(mismatch_details)}"
                checks.append(LabValidationCheckResult(
                    name="Quantum State & Measurement Distribution",
                    passed=False,
                    message=msg,
                    details=msg
                ))

        # Overall pass criteria: All checks passed
        all_passed = all(c.passed for c in checks)

        xp_awarded = 0
        is_completed = False
        next_problem_id = None

        if all_passed and user:
            is_completed = True
            # Find or create progress record
            rec = (
                db.query(LabProgressRecord)
                .filter(
                    LabProgressRecord.user_id == user.id,
                    LabProgressRecord.lab_problem_id == problem.id
                )
                .first()
            )
            now = datetime.now(timezone.utc)
            if not rec:
                rec = LabProgressRecord(
                    user_id=user.id,
                    lab_problem_id=problem.id,
                    lesson_id=problem.lesson_id,
                    is_completed=True,
                    attempts=1,
                    best_circuit_json=circuit_data,
                    completed_at=now
                )
                db.add(rec)
                xp_awarded = problem.xp_reward
            else:
                rec.attempts += 1
                if not rec.is_completed:
                    rec.is_completed = True
                    rec.completed_at = now
                    xp_awarded = problem.xp_reward
                rec.best_circuit_json = circuit_data

            # Award XP to user profile
            if xp_awarded > 0:
                profile = db.query(Profile).filter(Profile.user_id == user.id).first()
                if profile:
                    profile.total_xp += xp_awarded
                    profile.level = 1 + (profile.total_xp // 100)

            # Record Adaptive Learning Event
            try:
                from app.services.adaptive.event_service import EventService
                from app.schemas.adaptive import LearningEventCreate, LearningEventType

                EventService.record_event(
                    db,
                    user,
                    LearningEventCreate(
                        event_type=LearningEventType.PRACTICE_COMPLETED,
                        topic_id=problem.topic_id,
                        lesson_id=problem.lesson_id,
                        metadata={
                            "lab_problem_id": problem.id,
                            "problem_title": problem.title,
                            "difficulty": problem.difficulty,
                            "xp_awarded": xp_awarded,
                            "circuit_qubits": qubits,
                            "circuit_gates": len(gates)
                        }
                    )
                )
            except Exception:
                pass

            db.commit()

            # Find next lab problem if available
            next_p = (
                db.query(LabProblem)
                .filter(
                    LabProblem.lesson_id == problem.lesson_id,
                    LabProblem.display_order > problem.display_order
                )
                .order_by(LabProblem.display_order)
                .first()
            )
            if next_p:
                next_problem_id = next_p.id

        score = 100.0 if all_passed else (sum(1 for c in checks if c.passed) / max(1, len(checks))) * 100.0
        message = (
            f"✓ Lab Practice Completed! {problem.success_criteria}"
            if all_passed
            else "Lab requirements not yet satisfied. Review the check details below and adjust your circuit."
        )

        return LabValidationResponse(
            lab_problem_id=problem.id,
            problem_id=problem.id,
            passed=all_passed,
            is_valid=all_passed,
            score=score,
            message=message,
            feedback=message,
            explanation=problem.explanation,
            checks=checks,
            xp_awarded=xp_awarded,
            is_completed=is_completed,
            next_problem_id=next_problem_id
        )
