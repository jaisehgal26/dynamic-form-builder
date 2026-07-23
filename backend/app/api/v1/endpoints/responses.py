from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import ms_timestamp, require_session
from app.core.exceptions import AppError
from app.models import FormResponse
from app.services.export import responses_to_csv
from app.services.forms import load_form_fields, load_form_for_owner

router = APIRouter()


@router.get("/{form_id}/responses")
def list_responses(
    form_id: str,
    page: int = Query(1, ge=1),
    from_: int | None = Query(None, alias="from"),
    to: int | None = Query(None),
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    q = db.query(FormResponse).filter(FormResponse.form_id == form_id)
    if from_:
        q = q.filter(FormResponse.submitted_at >= datetime.fromtimestamp(from_ / 1000, tz=timezone.utc))
    if to:
        q = q.filter(FormResponse.submitted_at <= datetime.fromtimestamp(to / 1000, tz=timezone.utc))
    rows = q.order_by(FormResponse.submitted_at.desc()).all()
    page_size = 50
    start = (page - 1) * page_size
    page_rows = rows[start : start + page_size]
    return {
        "responses": [
            {
                "id": r.id,
                "submittedAt": ms_timestamp(r.submitted_at),
                "startedAt": ms_timestamp(r.started_at),
                "completionTimeSeconds": r.completion_time_seconds,
                "respondentEmail": r.respondent_email,
                "answers": r.answers_json or {},
                "metadata": r.metadata_json or {},
            }
            for r in page_rows
        ],
        "total": len(rows),
        "page": page,
        "pageSize": page_size,
    }


@router.get("/{form_id}/responses/{response_id}")
def get_response(
    form_id: str,
    response_id: str,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    row = (
        db.query(FormResponse)
        .filter(FormResponse.id == response_id, FormResponse.form_id == form_id)
        .first()
    )
    if not row:
        raise AppError("Response not found", 404)
    return {
        "response": {
            "id": row.id,
            "submittedAt": ms_timestamp(row.submitted_at),
            "startedAt": ms_timestamp(row.started_at),
            "completionTimeSeconds": row.completion_time_seconds,
            "respondentEmail": row.respondent_email,
            "answers": row.answers_json or {},
            "metadata": row.metadata_json or {},
        }
    }


@router.delete("/{form_id}/responses/{response_id}")
def delete_response(
    form_id: str,
    response_id: str,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    row = (
        db.query(FormResponse)
        .filter(FormResponse.id == response_id, FormResponse.form_id == form_id)
        .first()
    )
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}


@router.get("/{form_id}/responses/export")
def export_responses(
    form_id: str,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    fields = load_form_fields(db, form_id)
    rows_db = (
        db.query(FormResponse)
        .filter(FormResponse.form_id == form_id)
        .order_by(FormResponse.submitted_at.desc())
        .all()
    )
    rows = [
        {
            "id": r.id,
            "submittedAt": ms_timestamp(r.submitted_at),
            "startedAt": ms_timestamp(r.started_at),
            "completionTimeSeconds": r.completion_time_seconds,
            "answers": r.answers_json or {},
        }
        for r in rows_db
    ]
    csv = responses_to_csv(fields, rows)
    return PlainTextResponse(
        csv,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="responses-{form_id}.csv"'},
    )
