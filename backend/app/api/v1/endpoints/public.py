from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, Depends, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import client_ip
from app.core.exceptions import AppError
from app.core.rate_limit import parse_device_from_ua, rate_limit
from app.core.security import (
    cookie_name_for_slug,
    issue_access_token,
    verify_access_token,
    verify_password,
)
from app.models import FormEvent, FormResponse
from app.services.forms import (
    is_field_visible,
    load_form_by_slug,
    load_form_fields,
    read_settings,
    resolve_public_form,
)
from app.utils.ids import generate_id

router = APIRouter()


class VerifyPasswordBody(BaseModel):
    password: str = Field(min_length=1)


class SubmitResponseBody(BaseModel):
    answers: dict = {}
    startedAt: int | None = None
    respondentEmail: str | None = None
    sessionId: str | None = None
    metadata: dict | None = None
    hidden: dict | None = None


class EventBody(BaseModel):
    eventType: str
    step: int | None = None
    fieldId: str | None = None
    sessionId: str | None = None
    metadata: dict | None = None


@router.get("/{slug}")
def get_public_form(slug: str, db: Session = Depends(get_db)):
    return resolve_public_form(db, slug)


@router.post("/{slug}/verify-password")
def verify_password_route(
    slug: str,
    body: VerifyPasswordBody,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    ip = client_ip(request)
    if not rate_limit(f"verify:{ip}:{slug}", 8, 60_000):
        raise AppError("Too many attempts. Please try again later.", 429)
    form = load_form_by_slug(db, slug)
    if not form or form.status != "published" or not form.password_hash:
        raise AppError("Form not found", 404)
    if not verify_password(body.password, form.password_hash):
        raise AppError("Incorrect password.", 401)
    token = issue_access_token(slug)
    response.set_cookie(
        key=cookie_name_for_slug(slug),
        value=token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=6 * 60 * 60,
    )
    resolution = resolve_public_form(db, slug)
    if resolution.get("form"):
        resolution["form"]["fields"] = load_form_fields(db, form.id)
        resolution["state"] = "ok"
    return resolution


@router.post("/{slug}/responses")
def submit_response(
    slug: str,
    body: SubmitResponseBody,
    request: Request,
    db: Session = Depends(get_db),
    access_cookie: str | None = Cookie(default=None),
):
    ip = client_ip(request)
    if not rate_limit(f"submit:{ip}:{slug}", 10, 60_000):
        raise AppError("Too many submissions. Please try again later.", 429)

    form = load_form_by_slug(db, slug)
    if not form or form.status != "published":
        raise AppError("Form is not accepting responses.", 404)

    if form.expires_at and form.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise AppError("This form is no longer accepting responses.", 410)

    if form.response_limit and form.response_limit > 0:
        count = db.query(func.count(FormResponse.id)).filter(FormResponse.form_id == form.id).scalar() or 0
        if count >= form.response_limit:
            raise AppError("This form has reached its submission limit.", 410)

    if form.password_hash:
        cookie_name = cookie_name_for_slug(slug)
        token = request.cookies.get(cookie_name) or access_cookie
        if not verify_access_token(token, slug):
            raise AppError("Password required to submit this form.", 401)

    fields = load_form_fields(db, form.id)
    settings = read_settings(form)
    errors: dict[str, str] = {}
    for field in fields:
        if field["type"] in ("section_heading", "page_break"):
            continue
        if not is_field_visible(field, body.answers):
            continue
        value = body.answers.get(field["id"])
        empty = value is None or value == "" or (isinstance(value, list) and len(value) == 0)
        if field.get("required") and empty:
            errors[field["id"]] = "This field is required."
        if field["type"] == "email" and isinstance(value, str) and value and "@" not in value:
            errors[field["id"]] = "Enter a valid email."
    if errors:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=422, content={"error": "Validation failed", "fields": errors})

    if form.collect_email and not (body.respondentEmail or "").strip():
        raise AppError("Email is required to submit this form.", 422)

    ua = request.headers.get("user-agent")
    device_info = parse_device_from_ua(ua)
    referrer = request.headers.get("referer") or ""
    started_at = (
        datetime.fromtimestamp(body.startedAt / 1000, tz=timezone.utc)
        if body.startedAt and body.startedAt > 0
        else None
    )
    submitted_at = datetime.now(timezone.utc)
    completion = None
    if started_at:
        completion = max(0, int((submitted_at - started_at).total_seconds()))

    response_id = generate_id("resp")
    db.add(
        FormResponse(
            id=response_id,
            form_id=form.id,
            respondent_email=body.respondentEmail,
            answers_json=body.answers,
            metadata_json={
                **(body.metadata or {}),
                "hidden": body.hidden or {},
                "sessionId": body.sessionId,
                **device_info,
                "referrer": referrer,
                "ip": ip,
            },
            started_at=started_at,
            submitted_at=submitted_at,
            completion_time_seconds=completion,
        )
    )
    db.add(
        FormEvent(
            id=generate_id("evt"),
            form_id=form.id,
            event_type="submit",
            session_id=body.sessionId,
            metadata_json={**device_info, "referrer": referrer, "ip": ip},
        )
    )
    db.commit()
    return {"ok": True, "responseId": response_id}


@router.post("/{slug}/events")
def track_event(
    slug: str,
    body: EventBody,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = client_ip(request)
    if not rate_limit(f"events:{ip}:{slug}", 240, 60_000):
        raise AppError("Too many events.", 429)
    form = load_form_by_slug(db, slug)
    if not form or form.status != "published":
        return {"ok": True}
    ua = request.headers.get("user-agent")
    device_info = parse_device_from_ua(ua)
    db.add(
        FormEvent(
            id=generate_id("evt"),
            form_id=form.id,
            event_type=body.eventType,
            step=body.step,
            field_id=body.fieldId,
            session_id=body.sessionId,
            metadata_json={**(body.metadata or {}), **device_info, "ip": ip},
        )
    )
    db.commit()
    return {"ok": True}
