import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.base import Base, get_db
from app.core.security import create_access_token

# In-memory SQLite with StaticPool so all connections share the same in-memory DB during tests
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


# ==============================================================================
# 1. REGISTRATION TESTS
# ==============================================================================

def test_valid_registration(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "learner@quantumania.dev",
        "username": "quantum_user_1",
        "password": "StrongPassword123!",
        "display_name": "Quantum User"
    })
    assert res.status_code == 201
    body = res.json()
    assert body["success"] is True
    assert "token" in body["data"]
    assert body["data"]["email"] == "learner@quantumania.dev"
    assert body["data"]["username"] == "quantum_user_1"
    assert body["data"]["token_type"] == "Bearer"


def test_duplicate_email_registration(client):
    client.post("/api/v1/auth/register", json={
        "email": "duplicate@quantumania.dev",
        "username": "original_user",
        "password": "StrongPassword123!"
    })
    res = client.post("/api/v1/auth/register", json={
        "email": "duplicate@quantumania.dev",
        "username": "another_user",
        "password": "StrongPassword123!"
    })
    assert res.status_code == 400
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "ACCOUNT_ALREADY_EXISTS"


def test_duplicate_username_registration(client):
    client.post("/api/v1/auth/register", json={
        "email": "user1@quantumania.dev",
        "username": "same_handle",
        "password": "StrongPassword123!"
    })
    res = client.post("/api/v1/auth/register", json={
        "email": "user2@quantumania.dev",
        "username": "same_handle",
        "password": "StrongPassword123!"
    })
    assert res.status_code == 400
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "ACCOUNT_ALREADY_EXISTS"


def test_invalid_email_registration(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "username": "valid_user",
        "password": "StrongPassword123!"
    })
    assert res.status_code == 422
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_short_password_registration(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "shortpw@quantumania.dev",
        "username": "short_user",
        "password": "123"
    })
    assert res.status_code == 422
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_missing_fields_registration(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "missing_fields@quantumania.dev"
    })
    assert res.status_code == 422
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


# ==============================================================================
# 2. LOGIN TESTS
# ==============================================================================

def test_valid_login(client):
    client.post("/api/v1/auth/register", json={
        "email": "login_user@quantumania.dev",
        "username": "login_user",
        "password": "SecretPassword123!"
    })
    res = client.post("/api/v1/auth/login", json={
        "email": "login_user@quantumania.dev",
        "password": "SecretPassword123!"
    })
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "token" in body["data"]
    assert body["data"]["username"] == "login_user"


def test_invalid_password_login(client):
    client.post("/api/v1/auth/register", json={
        "email": "login_user2@quantumania.dev",
        "username": "login_user2",
        "password": "SecretPassword123!"
    })
    res = client.post("/api/v1/auth/login", json={
        "email": "login_user2@quantumania.dev",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_CREDENTIALS"


def test_nonexistent_user_login(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "ghost@quantumania.dev",
        "password": "AnyPassword123!"
    })
    assert res.status_code == 401
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_CREDENTIALS"


def test_missing_credentials_login(client):
    res = client.post("/api/v1/auth/login", json={})
    assert res.status_code == 422
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


# ==============================================================================
# 3. PROFILE & ROUTE PROTECTION TESTS
# ==============================================================================

def test_me_authorized_and_unauthorized(client):
    # Unauthorized without header
    res = client.get("/api/v1/me")
    assert res.status_code == 401
    assert res.json()["success"] is False

    # Unauthorized with bogus token
    res = client.get("/api/v1/me", headers={"Authorization": "Bearer bogus-token-xyz"})
    assert res.status_code == 401
    assert res.json()["success"] is False

    # Register and get profile
    reg = client.post("/api/v1/auth/register", json={
        "email": "me_test@quantumania.dev",
        "username": "me_tester",
        "password": "StrongPassword123!",
        "display_name": "Me Tester"
    }).json()
    token = reg["data"]["token"]

    res = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["email"] == "me_test@quantumania.dev"
    assert body["data"]["username"] == "me_tester"
    assert body["data"]["display_name"] == "Me Tester"
    assert body["data"]["experience_level"] == "beginner"


def test_user_cannot_access_other_user_data(client):
    # User 1 registers
    reg1 = client.post("/api/v1/auth/register", json={
        "email": "user_alpha@quantumania.dev",
        "username": "user_alpha",
        "password": "AlphaPassword123!",
        "display_name": "Alpha"
    }).json()
    token1 = reg1["data"]["token"]

    # User 2 registers
    reg2 = client.post("/api/v1/auth/register", json={
        "email": "user_beta@quantumania.dev",
        "username": "user_beta",
        "password": "BetaPassword123!",
        "display_name": "Beta"
    }).json()
    token2 = reg2["data"]["token"]

    # Request with token 1 returns only User 1 data
    me1 = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token1}"}).json()
    assert me1["data"]["username"] == "user_alpha"
    assert me1["data"]["email"] == "user_alpha@quantumania.dev"

    # Request with token 2 returns only User 2 data
    me2 = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token2}"}).json()
    assert me2["data"]["username"] == "user_beta"
    assert me2["data"]["email"] == "user_beta@quantumania.dev"


def test_expired_token(client):
    # Create an already expired token (minus 10 minutes)
    expired_token = create_access_token(
        subject="some-user-uuid",
        expires_delta=timedelta(minutes=-10)
    )
    res = client.get("/api/v1/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert res.json()["success"] is False
    assert res.json()["error"]["code"] == "UNAUTHORIZED"


def test_update_profile(client):
    reg = client.post("/api/v1/auth/register", json={
        "email": "updater@quantumania.dev",
        "username": "updater_user",
        "password": "StrongPassword123!"
    }).json()
    token = reg["data"]["token"]

    update_res = client.put(
        "/api/v1/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "display_name": "Updated Display Name",
            "experience_level": "intermediate"
        }
    )
    assert update_res.status_code == 200
    body = update_res.json()
    assert body["success"] is True
    assert body["data"]["display_name"] == "Updated Display Name"
    assert body["data"]["experience_level"] == "intermediate"


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
