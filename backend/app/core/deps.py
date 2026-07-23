from datetime import datetime

from fastapi import Cookie, Depends, Request
from sqlalchemy.orm import Session

from app.core.constants import SESSION_COOKIE_NAME
from app.core.database import get_db
from app.core.exceptions import AuthError
from app.core.security import verify_session_token
from app.models import User


def get_session(
  ff_session: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
) -> dict[str, str] | None:
    if not ff_session:
        return None
    return verify_session_token(ff_session)


def require_session(
    session: dict[str, str] | None = Depends(get_session),
) -> dict[str, str]:
    if not session:
        raise AuthError()
    return session


def get_current_user(
    session: dict[str, str] | None = Depends(get_session),
    db: Session = Depends(get_db),
) -> User | None:
    if not session:
        return None
    return db.query(User).filter(User.id == session["userId"]).first()


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real = request.headers.get("x-real-ip")
    return real or "anonymous"


def ms_timestamp(dt: datetime | None) -> int | None:
    if dt is None:
        return None
    return int(dt.timestamp() * 1000)
