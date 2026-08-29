import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import app.routes.auth as auth_module
from app.routes.auth import LoginRequest, login


class FakeSupabase:
    def __init__(self, user):
        self.user = user
        self.updated = None
        self.history = []

    def table(self, name):
        return FakeTable(self, name)


class FakeTable:
    def __init__(self, db, name):
        self.db = db
        self.name = name
        self._filters = []
        self._query = None

    def select(self, *args, **kwargs):
        self._query = "select"
        return self

    def ilike(self, field, value):
        self._query = "ilike"
        self._filters.append((field, value))
        return self

    def eq(self, field, value):
        self._filters.append((field, value))
        self._query = "eq"
        return self

    def update(self, data):
        self._query = "update"
        self.db.updated = data
        return self

    def insert(self, data):
        self._query = "insert"
        self.db.history.append((self.name, data))
        return self

    def execute(self):
        if self.name == "users" and self._query == "ilike":
            return SimpleNamespace(data=[self.db.user])
        if self.name == "users" and self._query == "update":
            return SimpleNamespace(data=[])
        if self.name == "login_history" and self._query == "insert":
            return SimpleNamespace(data=[])
        if self.name == "students" and self._query == "select":
            return SimpleNamespace(data=[{"roll_number": "S-100", "name": "Student Test"}])
        if self.name == "hod" and self._query == "select":
            return SimpleNamespace(data=[{"name": "HOD Test"}])
        if self.name == "faculty" and self._query == "select":
            return SimpleNamespace(data=[{"name": "Faculty Test"}])
        if self.name == "students" and self._query == "eq":
            return SimpleNamespace(data=[{"name": "Student Test"}])
        return SimpleNamespace(data=[])


def test_login_rejects_while_locked_and_shows_minutes(monkeypatch):
    user = {
        "id": "u-1",
        "email": "hod@example.com",
        "username": "hoduser",
        "roles": {"name": "hod"},
        "password_hash": "",
        "failed_login_attempts": 5,
        "locked_until": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
        "first_login": False,
        "password_expires_at": None,
    }
    monkeypatch.setattr(auth_module, "supabase", FakeSupabase(user))

    async def run():
        with pytest.raises(HTTPException) as exc:
            await login(LoginRequest(email="hod@example.com", password="badpass", role="hod"))
        assert exc.value.status_code == 423
        assert "Try again after 5 minute" in exc.value.detail

    asyncio.run(run())


def test_login_unlocks_after_lockout_period_and_resets_attempts(monkeypatch):
    user = {
        "id": "u-1",
        "email": "hod@example.com",
        "username": "hoduser",
        "roles": {"name": "hod"},
        "password_hash": "",
        "failed_login_attempts": 5,
        "locked_until": (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat(),
        "first_login": False,
        "password_expires_at": None,
    }

    def make_hash(password: str):
        import bcrypt
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user["password_hash"] = make_hash("correctpassword")
    monkeypatch.setattr(auth_module, "supabase", FakeSupabase(user))

    async def run():
        result = await login(LoginRequest(email="hod@example.com", password="correctpassword", role="hod"))
        assert result.user["role"] == "hod"
        assert result.user["email"] == "hod@example.com"

    asyncio.run(run())
