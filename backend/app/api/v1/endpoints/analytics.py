from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import ms_timestamp, require_session
from app.models import FormEvent, FormResponse
from app.services.analytics import (
    compute_analytics,
    compute_funnel,
    compute_interaction_insights,
)
from app.services.forms import load_form_fields, load_form_for_owner

router = APIRouter()

RANGE_MAP = {"today": 1, "7d": 7, "30d": 30, "all": 3650}


def _load_analytics_data(db: Session, form_id: str, range_key: str):
    range_days = RANGE_MAP.get(range_key, 14)
    since = datetime.now(timezone.utc) - timedelta(days=range_days)
    fields = load_form_fields(db, form_id)
    events_db = (
        db.query(FormEvent)
        .filter(FormEvent.form_id == form_id, FormEvent.created_at >= since)
        .all()
    )
    responses_db = (
        db.query(FormResponse)
        .filter(FormResponse.form_id == form_id, FormResponse.submitted_at >= since)
        .all()
    )
    events = [
        {
            "eventType": e.event_type,
            "step": e.step,
            "fieldId": e.field_id,
            "sessionId": e.session_id,
            "createdAt": ms_timestamp(e.created_at),
        }
        for e in events_db
    ]
    responses = [
        {
            "submittedAt": ms_timestamp(r.submitted_at),
            "completionTimeSeconds": r.completion_time_seconds,
            "answers": r.answers_json or {},
        }
        for r in responses_db
    ]
    return fields, events, responses, range_days


@router.get("/{form_id}/analytics")
def analytics(
    form_id: str,
    range: str = Query("14d"),
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    range_key = range if range in RANGE_MAP else "30d"
    fields, events, responses, range_days = _load_analytics_data(db, form_id, range_key)
    return compute_analytics(fields, events, responses, range_days)


@router.get("/{form_id}/analytics/funnel")
def funnel(
    form_id: str,
    range: str = Query("30d"),
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    fields, events, responses, _ = _load_analytics_data(db, form_id, range)
    return compute_funnel(events, len(responses))


@router.get("/{form_id}/analytics/interactions")
def interactions(
    form_id: str,
    range: str = Query("30d"),
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    fields, events, _, _ = _load_analytics_data(db, form_id, range)
    return compute_interaction_insights(fields, events)


@router.get("/{form_id}/analytics/questions")
def questions(
    form_id: str,
    range: str = Query("30d"),
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    load_form_for_owner(db, form_id, session["userId"])
    fields, events, responses, range_days = _load_analytics_data(db, form_id, range)
    result = compute_analytics(fields, events, responses, range_days)
    return {"questions": result["questions"]}
