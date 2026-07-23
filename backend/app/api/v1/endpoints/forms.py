from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import ms_timestamp, require_session
from app.core.exceptions import AppError
from app.models import Form, FormEvent, FormField, FormResponse
from app.services.forms import (
    DEFAULT_SETTINGS,
    DEFAULT_THEME,
    field_to_dict,
    load_form_fields,
    load_form_for_owner,
    read_settings,
    read_theme,
    save_full_schema,
)
from app.utils.ids import generate_field_id, generate_form_slug, generate_id

router = APIRouter()


class CreateFormBody(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)


class UpdateFormBody(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    status: str | None = None


class AccessBody(BaseModel):
    password: str | None = None
    clearPassword: bool | None = None
    expiresAt: int | None = None
    responseLimit: int | None = None
    collectEmail: bool | None = None


class FullFormBody(BaseModel):
    title: str
    description: str | None = None
    settings: dict | None = None
    theme: dict | None = None
    fields: list[dict] = []
    access: AccessBody | None = None


@router.get("")
def list_forms(session: dict = Depends(require_session), db: Session = Depends(get_db)):
    forms = db.query(Form).filter(Form.user_id == session["userId"]).all()
    response_counts = dict(
        db.query(FormResponse.form_id, func.count(FormResponse.id))
        .group_by(FormResponse.form_id)
        .all()
    )
    view_counts = dict(
        db.query(FormEvent.form_id, func.count(FormEvent.id))
        .filter(FormEvent.event_type == "view")
        .group_by(FormEvent.form_id)
        .all()
    )
    out = sorted(
        [
            {
                "id": f.id,
                "title": f.title,
                "description": f.description,
                "slug": f.slug,
                "status": f.status,
                "createdAt": ms_timestamp(f.created_at),
                "updatedAt": ms_timestamp(f.updated_at),
                "publishedAt": ms_timestamp(f.published_at),
                "responseCount": int(response_counts.get(f.id, 0)),
                "viewCount": int(view_counts.get(f.id, 0)),
            }
            for f in forms
        ],
        key=lambda x: x["updatedAt"] or 0,
        reverse=True,
    )
    return {"forms": out}


@router.post("", status_code=201)
def create_form(
    body: CreateFormBody,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    form_id = generate_id("form")
    slug = generate_form_slug(body.title)
    form = Form(
        id=form_id,
        user_id=session["userId"],
        title=body.title,
        description=body.description,
        slug=slug,
        status="draft",
        schema_json={},
        theme_json=DEFAULT_THEME,
        settings_json=DEFAULT_SETTINGS,
    )
    db.add(form)
    db.commit()
    return {"form": {"id": form_id, "slug": slug}}


@router.get("/{form_id}")
def get_form(
    form_id: str,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    form = load_form_for_owner(db, form_id, session["userId"])
    fields = load_form_fields(db, form_id)
    return {
        "form": {
            "id": form.id,
            "title": form.title,
            "description": form.description,
            "slug": form.slug,
            "status": form.status,
            "createdAt": ms_timestamp(form.created_at),
            "updatedAt": ms_timestamp(form.updated_at),
            "publishedAt": ms_timestamp(form.published_at),
            "settings": read_settings(form),
            "theme": read_theme(form),
            "fields": fields,
            "hasPassword": bool(form.password_hash),
            "expiresAt": ms_timestamp(form.expires_at),
            "responseLimit": form.response_limit,
            "collectEmail": bool(form.collect_email),
        }
    }


@router.patch("/{form_id}")
def update_form(
    form_id: str,
    body: UpdateFormBody,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    form = load_form_for_owner(db, form_id, session["userId"])
    if body.title is not None:
        form.title = body.title
    if body.description is not None:
        form.description = body.description
    if body.status is not None:
        form.status = body.status
        if body.status == "published":
            form.published_at = datetime.now(timezone.utc)
    form.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


@router.delete("/{form_id}")
def delete_form(
    form_id: str,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    form = load_form_for_owner(db, form_id, session["userId"])
    db.delete(form)
    db.commit()
    return {"ok": True}


@router.patch("/{form_id}/schema")
def update_schema(
    form_id: str,
    body: FullFormBody,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    form = load_form_for_owner(db, form_id, session["userId"])
    saved = save_full_schema(db, form, body.model_dump(), body.access.model_dump() if body.access else None)
    return {"ok": True, "savedAt": int(saved.timestamp() * 1000)}


@router.post("/{form_id}/publish")
def publish_form(
    form_id: str,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    form = load_form_for_owner(db, form_id, session["userId"])
    fields = load_form_fields(db, form_id)
    inputs = [f for f in fields if f["type"] not in ("section_heading", "page_break")]
    if not inputs:
        raise AppError("Add at least one question before publishing.", 400)
    form.status = "published"
    form.published_at = datetime.now(timezone.utc)
    form.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "slug": form.slug}


@router.post("/{form_id}/unpublish")
def unpublish_form(
    form_id: str,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    form = load_form_for_owner(db, form_id, session["userId"])
    form.status = "draft"
    form.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


@router.post("/{form_id}/duplicate", status_code=201)
def duplicate_form(
    form_id: str,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    original = load_form_for_owner(db, form_id, session["userId"])
    fields = load_form_fields(db, form_id)
    new_id = generate_id("form")
    new_title = f"{original.title} (Copy)"
    slug = generate_form_slug(new_title)
    now = datetime.now(timezone.utc)
    new_form = Form(
        id=new_id,
        user_id=session["userId"],
        title=new_title,
        description=original.description,
        slug=slug,
        status="draft",
        schema_json=original.schema_json or {},
        theme_json=original.theme_json or DEFAULT_THEME,
        settings_json=original.settings_json or DEFAULT_SETTINGS,
        created_at=now,
        updated_at=now,
    )
    db.add(new_form)
    for f in fields:
        db.add(
            FormField(
                id=generate_field_id(),
                form_id=new_id,
                type=f["type"],
                label=f["label"],
                description=f.get("description"),
                placeholder=f.get("placeholder"),
                required=f.get("required", False),
                position=f["position"],
                step=f.get("step", 1),
                config_json=f.get("config") or {},
                validation_json=f.get("validation") or {},
                logic_json=f.get("logic") or [],
                created_at=now,
                updated_at=now,
            )
        )
    db.commit()
    return {"form": {"id": new_id, "slug": slug}}


@router.get("/{form_id}/export-schema")
def export_schema(
    form_id: str,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    from fastapi.responses import JSONResponse

    form = load_form_for_owner(db, form_id, session["userId"])
    fields = load_form_fields(db, form_id)
    payload = {
        "title": form.title,
        "description": form.description or "",
        "settings": read_settings(form),
        "theme": read_theme(form),
        "fields": fields,
    }
    return JSONResponse(
        content=payload,
        headers={"Content-Disposition": f'attachment; filename="{form.slug}-schema.json"'},
    )


@router.post("/{form_id}/import-schema")
def import_schema(
    form_id: str,
    body: FullFormBody,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    form = load_form_for_owner(db, form_id, session["userId"])
    data = body.model_dump()
    data.pop("access", None)
    save_full_schema(db, form, data, None)
    return {"ok": True}
