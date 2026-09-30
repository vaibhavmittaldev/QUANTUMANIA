import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.base import Base, get_db
from app.services.learning_service import LearningService
from app.services.curriculum_data import validate_curriculum_integrity

# In-memory SQLite with StaticPool
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    LearningService.seed_curriculum_if_needed(session)
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register_user(client, email, username):
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "username": username,
        "password": "Password123!"
    })
    return res.json()["data"]["token"]


# ==============================================================================
# 1. CURRICULUM INTEGRITY TESTS
# ==============================================================================

def test_curriculum_data_integrity():
    assert validate_curriculum_integrity() is True


def test_get_courses_public(client):
    res = client.get("/api/v1/courses")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) >= 1
    course = body["data"][0]
    assert course["id"] == "crs_intro_quantum"
    assert course["total_modules"] == 5
    assert course["total_lessons"] == 20
    assert course["progress_percent"] == 0.0


def test_get_course_detail(client):
    res = client.get("/api/v1/courses/crs_intro_quantum")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    course = body["data"]
    assert len(course["modules"]) == 5
    # Total lessons across 5 modules must equal 20
    total_lessons = sum(len(m["lessons"]) for m in course["modules"])
    assert total_lessons == 20


def test_get_invalid_course(client):
    res = client.get("/api/v1/courses/nonexistent-course")
    assert res.status_code == 404
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "NOT_FOUND"


def test_get_module_detail(client):
    res = client.get("/api/v1/modules/mod_foundations")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["id"] == "mod_foundations"
    assert len(body["data"]["lessons"]) == 4


def test_get_invalid_module(client):
    res = client.get("/api/v1/modules/invalid-module-id")
    assert res.status_code == 404
    assert res.json()["success"] is False


def test_get_lesson_detail(client):
    res = client.get("/api/v1/lessons/les_01_what_is_qc")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    lesson = body["data"]
    assert lesson["id"] == "les_01_what_is_qc"
    assert lesson["module_id"] == "mod_foundations"
    assert len(lesson["objectives"]) >= 2
    assert len(lesson["content_blocks"]) >= 3
    # First lesson has no previous, but has next
    assert lesson["navigation"]["previous_lesson_id"] is None
    assert lesson["navigation"]["next_lesson_id"] == "les_02_bits_vs_qubits"


def test_lesson_navigation_middle_and_end(client):
    # Middle lesson (Lesson 2)
    res2 = client.get("/api/v1/lessons/les_02_bits_vs_qubits").json()["data"]
    assert res2["navigation"]["previous_lesson_id"] == "les_01_what_is_qc"
    assert res2["navigation"]["next_lesson_id"] == "les_03_superposition"

    # Last lesson (Lesson 20)
    res20 = client.get("/api/v1/lessons/les_20_circuit_to_result").json()["data"]
    assert res20["navigation"]["previous_lesson_id"] == "les_19_running_quantum_circuit"
    assert res20["navigation"]["next_lesson_id"] is None


def test_get_invalid_lesson(client):
    res = client.get("/api/v1/lessons/invalid-lesson-id")
    assert res.status_code == 404
    assert res.json()["success"] is False


# ==============================================================================
# 2. PROGRESS & COMPLETION TESTS
# ==============================================================================

def test_unauthenticated_cannot_complete_lesson(client):
    res = client.post("/api/v1/lessons/les_01_what_is_qc/complete")
    assert res.status_code == 401
    assert res.json()["success"] is False


def test_authenticated_complete_lesson_flow(client):
    token = register_user(client, "student1@quantumania.dev", "student1")
    headers = {"Authorization": f"Bearer {token}"}

    # Complete lesson 1
    res = client.post("/api/v1/lessons/les_01_what_is_qc/complete", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["is_completed"] is True
    assert body["data"]["xp_awarded"] == 25
    assert body["data"]["next_lesson_id"] == "les_02_bits_vs_qubits"
    assert body["data"]["course_progress_percent"] == 5.0  # 1/20 = 5%

    # Verify lesson retrieval now reflects is_completed = True
    l1 = client.get("/api/v1/lessons/les_01_what_is_qc", headers=headers).json()["data"]
    assert l1["is_completed"] is True

    # User profile should have earned 25 XP
    me = client.get("/api/v1/me", headers=headers).json()["data"]
    assert me["points"] == 25


def test_duplicate_lesson_completion_idempotency(client):
    token = register_user(client, "student2@quantumania.dev", "student2")
    headers = {"Authorization": f"Bearer {token}"}

    # Complete once
    res1 = client.post("/api/v1/lessons/les_01_what_is_qc/complete", headers=headers).json()
    assert res1["data"]["xp_awarded"] == 25

    # Complete again (idempotent)
    res2 = client.post("/api/v1/lessons/les_01_what_is_qc/complete", headers=headers).json()
    assert res2["data"]["is_completed"] is True
    assert res2["data"]["xp_awarded"] == 0  # No duplicate XP

    # User XP remains 25
    me = client.get("/api/v1/me", headers=headers).json()["data"]
    assert me["points"] == 25


def test_progress_calculation_formula(client):
    token = register_user(client, "math_student@quantumania.dev", "math_student")
    headers = {"Authorization": f"Bearer {token}"}

    # Complete 4 lessons in Module 1 (les_01 to les_04)
    for lid in ["les_01_what_is_qc", "les_02_bits_vs_qubits", "les_03_superposition", "les_04_measurement"]:
        client.post(f"/api/v1/lessons/{lid}/complete", headers=headers)

    # Complete 4 lessons in Module 2 (les_05 to les_08)
    for lid in ["les_05_quantum_states", "les_06_quantum_gates", "les_07_hadamard_gate", "les_08_pauli_gates"]:
        client.post(f"/api/v1/lessons/{lid}/complete", headers=headers)

    # Total completed = 8 / 20 = 40.0%
    prog = client.get("/api/v1/learning/progress", headers=headers).json()["data"]
    assert prog["completed_lessons_count"] == 8
    assert prog["total_lessons_count"] == 20
    assert prog["course_progress_percent"] == 40.0

    # Module 1 has 4/4 completed = 100%
    mod1_prog = next(m for m in prog["modules_progress"] if m["module_id"] == "mod_foundations")
    assert mod1_prog["completed_lessons"] == 4
    assert mod1_prog["progress_percent"] == 100.0

    # Next incomplete lesson should point to Lesson 9 (les_09_multiple_qubits)
    assert prog["recent_incomplete_lesson"]["lesson_id"] == "les_09_multiple_qubits"


def test_user_progress_isolation(client):
    tokenA = register_user(client, "alice@quantumania.dev", "alice")
    tokenB = register_user(client, "bob@quantumania.dev", "bob")

    # Alice completes lesson 1
    client.post("/api/v1/lessons/les_01_what_is_qc/complete", headers={"Authorization": f"Bearer {tokenA}"})

    # Bob checks progress -> 0%
    progB = client.get("/api/v1/learning/progress", headers={"Authorization": f"Bearer {tokenB}"}).json()["data"]
    assert progB["completed_lessons_count"] == 0
    assert progB["course_progress_percent"] == 0.0

    # Alice checks progress -> 5%
    progA = client.get("/api/v1/learning/progress", headers={"Authorization": f"Bearer {tokenA}"}).json()["data"]
    assert progA["completed_lessons_count"] == 1
    assert progA["course_progress_percent"] == 5.0
