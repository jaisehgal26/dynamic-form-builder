import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_signup_and_me(client):
    res = client.post(
        "/api/auth/signup",
        json={"name": "Test User", "email": "test@example.com", "password": "password123"},
    )
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "test@example.com"

    res = client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "test@example.com"


def test_login_invalid(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "wrong"},
    )
    assert res.status_code == 401


def test_redis_key_prefix():
    from app.core.rate_limit import _redis_key

    assert _redis_key("submit:1.2.3.4:my-form").startswith("formforge:rl:")
    assert "quickpad" not in _redis_key("test")
