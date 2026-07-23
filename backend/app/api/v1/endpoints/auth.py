from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.constants import SESSION_COOKIE_NAME, SESSION_DURATION_DAYS
from app.core.database import get_db
from app.core.deps import get_current_user, require_session
from app.core.exceptions import AppError
from app.core.security import (
    create_session_token,
    hash_password,
    verify_password,
)
from app.models import User
from app.utils.ids import generate_id

router = APIRouter()


class SignupBody(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
        max_age=60 * 60 * 24 * SESSION_DURATION_DAYS,
    )


@router.post("/signup")
def signup(body: SignupBody, response: Response, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise AppError("Email already registered", 409)
    user = User(
        id=generate_id("user"),
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    token = create_session_token(user.id, user.email, user.name)
    _set_session_cookie(response, token)
    return {"user": {"id": user.id, "email": user.email, "name": user.name}}


@router.post("/login")
def login(body: LoginBody, response: Response, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise AppError("Invalid email or password.", 401)
    token = create_session_token(user.id, user.email, user.name)
    _set_session_cookie(response, token)
    return {"user": {"id": user.id, "email": user.email, "name": user.name}}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me")
def me(user: User | None = Depends(get_current_user)):
    if not user:
        return {"user": None}
    return {"user": {"id": user.id, "email": user.email, "name": user.name}}
