from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.core.constants import ACCESS_COOKIE_TTL_SECONDS, SESSION_DURATION_DAYS


def _secret() -> str:
    if not settings.auth_secret or len(settings.auth_secret) < 16:
        raise RuntimeError("AUTH_SECRET is not set or too short")
    return settings.auth_secret


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_session_token(user_id: str, email: str, name: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
    return jwt.encode(
        {"userId": user_id, "email": email, "name": name, "exp": expire},
        _secret(),
        algorithm="HS256",
    )


def verify_session_token(token: str) -> dict[str, str] | None:
    try:
        payload = jwt.decode(token, _secret(), algorithms=["HS256"])
        if all(k in payload for k in ("userId", "email", "name")):
            return {
                "userId": str(payload["userId"]),
                "email": str(payload["email"]),
                "name": str(payload["name"]),
            }
    except JWTError:
        pass
    return None


def cookie_name_for_slug(slug: str) -> str:
    safe = "".join(c if c.isalnum() or c in "_-" else "_" for c in slug)
    return f"ff_pf_{safe}"


def issue_access_token(slug: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(seconds=ACCESS_COOKIE_TTL_SECONDS)
    return jwt.encode({"slug": slug, "exp": expire}, _secret(), algorithm="HS256")


def verify_access_token(token: str | None, slug: str) -> bool:
    if not token:
        return False
    try:
        payload = jwt.decode(token, _secret(), algorithms=["HS256"])
        return payload.get("slug") == slug
    except JWTError:
        return False
