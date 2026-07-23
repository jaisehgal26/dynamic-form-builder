import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models import Form, FormEvent, FormField, FormResponse
from app.utils.ids import generate_field_id

DEFAULT_SETTINGS: dict[str, Any] = {
    "multiStep": False,
    "showProgressBar": True,
    "showQuestionNumbers": False,
    "allowMultipleSubmissions": True,
    "thankYouMessage": "Thank you for your submission!",
    "closedMessage": "This form is no longer accepting responses.",
}

DEFAULT_THEME: dict[str, Any] = {
    "primaryColor": "#0a0a0a",
    "backgroundColor": "#ffffff",
    "font": "Inter",
}


def read_settings(form: Form) -> dict[str, Any]:
    data = form.settings_json if isinstance(form.settings_json, dict) else {}
    return {**DEFAULT_SETTINGS, **data}


def read_theme(form: Form) -> dict[str, Any]:
    data = form.theme_json if isinstance(form.theme_json, dict) else {}
    return {**DEFAULT_THEME, **data}


def field_to_dict(row: FormField) -> dict[str, Any]:
    return {
        "id": row.id,
        "type": row.type,
        "label": row.label,
        "description": row.description or "",
        "placeholder": row.placeholder or "",
        "required": bool(row.required),
        "position": row.position,
        "step": row.step,
        "config": row.config_json or {},
        "validation": row.validation_json or {},
        "logic": row.logic_json or [],
    }


def load_form_for_owner(db: Session, form_id: str, user_id: str) -> Form:
    form = (
        db.query(Form)
        .filter(Form.id == form_id, Form.user_id == user_id)
        .first()
    )
    if not form:
        raise AppError("Form not found", 404)
    return form


def load_form_fields(db: Session, form_id: str) -> list[dict[str, Any]]:
    rows = (
        db.query(FormField)
        .filter(FormField.form_id == form_id)
        .order_by(FormField.step, FormField.position)
        .all()
    )
    return [field_to_dict(r) for r in rows]


def load_form_by_slug(db: Session, slug: str) -> Form | None:
    return db.query(Form).filter(Form.slug == slug).first()


def resolve_public_form(db: Session, slug: str) -> dict[str, Any]:
    form = load_form_by_slug(db, slug)
    if not form or form.status != "published":
        return {"state": "not_found"}

    settings = read_settings(form)

    if form.expires_at and form.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return {"state": "expired", "closedMessage": settings.get("closedMessage")}

    if form.response_limit and form.response_limit > 0:
        count = (
            db.query(func.count(FormResponse.id))
            .filter(FormResponse.form_id == form.id)
            .scalar()
            or 0
        )
        if count >= form.response_limit:
            return {"state": "limit_reached", "closedMessage": settings.get("closedMessage")}

    base_payload = {
        "id": form.id,
        "slug": form.slug,
        "title": form.title,
        "description": form.description,
        "settings": settings,
        "theme": read_theme(form),
        "collectEmail": bool(form.collect_email),
    }

    if form.password_hash:
        return {
            "state": "password_required",
            "form": {**base_payload, "fields": []},
        }

    return {
        "state": "ok",
        "form": {**base_payload, "fields": load_form_fields(db, form.id)},
    }


def evaluate_logic(rule: dict[str, Any], answers: dict[str, Any]) -> bool:
    value = answers.get(rule.get("sourceFieldId"))
    op = rule.get("operator")
    target = rule.get("value")

    if op == "is_empty":
        return value is None or value == "" or (isinstance(value, list) and len(value) == 0)
    if op == "is_not_empty":
        return not (
            value is None or value == "" or (isinstance(value, list) and len(value) == 0)
        )
    if op == "equals":
        if isinstance(value, list):
            return target in value
        return str(value or "") == str(target or "")
    if op == "not_equals":
        if isinstance(value, list):
            return target not in value
        return str(value or "") != str(target or "")
    if op == "contains":
        if isinstance(value, list):
            return target in value
        return str(target or "") in str(value or "")
    if op == "not_contains":
        if isinstance(value, list):
            return target not in value
        return str(target or "") not in str(value or "")
    if op == "greater_than":
        return float(value or 0) > float(target or 0)
    if op == "less_than":
        return float(value or 0) < float(target or 0)
    return False


def is_field_visible(field: dict[str, Any], answers: dict[str, Any]) -> bool:
    logic = field.get("logic") or []
    if not logic:
        return True
    show_rules = [r for r in logic if r.get("action") == "show"]
    hide_rules = [r for r in logic if r.get("action") == "hide"]
    if any(evaluate_logic(r, answers) for r in hide_rules):
        return False
    if show_rules:
        return any(evaluate_logic(r, answers) for r in show_rules)
    return True


def save_full_schema(
    db: Session,
    form: Form,
    data: dict[str, Any],
    access: dict[str, Any] | None,
) -> datetime:
    from app.core.security import hash_password

    now = datetime.now(timezone.utc)
    form.title = data["title"]
    form.description = data.get("description")
    form.theme_json = data.get("theme") or DEFAULT_THEME
    form.settings_json = data.get("settings") or DEFAULT_SETTINGS
    form.schema_json = {
        "title": data["title"],
        "description": data.get("description") or "",
    }
    form.updated_at = now

    if access:
        if access.get("clearPassword"):
            form.password_hash = None
        elif access.get("password"):
            form.password_hash = hash_password(access["password"])
        if "expiresAt" in access:
            exp = access.get("expiresAt")
            form.expires_at = datetime.fromtimestamp(exp / 1000, tz=timezone.utc) if exp else None
        if "responseLimit" in access:
            form.response_limit = access.get("responseLimit")
        if "collectEmail" in access:
            form.collect_email = bool(access.get("collectEmail"))

    db.query(FormField).filter(FormField.form_id == form.id).delete()
    fields = sorted(data.get("fields") or [], key=lambda f: f.get("position", 0))
    for idx, f in enumerate(fields):
        db.add(
            FormField(
                id=f.get("id") or generate_field_id(),
                form_id=form.id,
                type=f["type"],
                label=f["label"],
                description=f.get("description"),
                placeholder=f.get("placeholder"),
                required=bool(f.get("required")),
                position=idx,
                step=f.get("step") or 1,
                config_json=f.get("config") or {},
                validation_json=f.get("validation") or {},
                logic_json=f.get("logic") or [],
                created_at=now,
                updated_at=now,
            )
        )
    db.commit()
    return now
