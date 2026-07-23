from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_session
from app.models import FormField
from app.services.forms import load_form_for_owner
from app.utils.ids import generate_field_id

router = APIRouter()


class CreateFieldBody(BaseModel):
    type: str
    label: str = Field(min_length=1)
    step: int = 1
    position: int | None = None


class UpdateFieldBody(BaseModel):
    type: str | None = None
    label: str | None = None
    description: str | None = None
    placeholder: str | None = None
    required: bool | None = None
    position: int | None = None
    step: int | None = None
    config: dict | None = None
    validation: dict | None = None
    logic: list | None = None


class ReorderBody(BaseModel):
    order: list[str]


@router.post("/{form_id}/fields", status_code=201)
def create_field(
    form_id: str,
    body: CreateFieldBody,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    max_pos = (
        db.query(FormField.position)
        .filter(FormField.form_id == form_id)
        .order_by(FormField.position.desc())
        .first()
    )
    position = body.position if body.position is not None else (max_pos[0] + 1 if max_pos else 0)
    now = datetime.now(timezone.utc)
    field_id = generate_field_id()
    field = FormField(
        id=field_id,
        form_id=form_id,
        type=body.type,
        label=body.label,
        position=position,
        step=body.step,
        created_at=now,
        updated_at=now,
    )
    db.add(field)
    db.commit()
    return {"field": {"id": field_id}}


@router.patch("/{form_id}/fields/{field_id}")
def update_field(
    form_id: str,
    field_id: str,
    body: UpdateFieldBody,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    field = db.query(FormField).filter(FormField.id == field_id, FormField.form_id == form_id).first()
    if not field:
        from app.core.exceptions import AppError
        raise AppError("Field not found", 404)
    data = body.model_dump(exclude_unset=True)
    for key, val in data.items():
        if key == "config":
            field.config_json = val or {}
        elif key == "validation":
            field.validation_json = val or {}
        elif key == "logic":
            field.logic_json = val or []
        else:
            setattr(field, key if key != "label" else "label", val)
    field.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


@router.delete("/{form_id}/fields/{field_id}")
def delete_field(
    form_id: str,
    field_id: str,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    field = db.query(FormField).filter(FormField.id == field_id, FormField.form_id == form_id).first()
    if field:
        db.delete(field)
        db.commit()
    return {"ok": True}


@router.patch("/{form_id}/fields/reorder")
def reorder_fields(
    form_id: str,
    body: ReorderBody,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    for idx, fid in enumerate(body.order):
        db.query(FormField).filter(FormField.id == fid, FormField.form_id == form_id).update(
            {"position": idx, "updated_at": datetime.now(timezone.utc)}
        )
    db.commit()
    return {"ok": True}
