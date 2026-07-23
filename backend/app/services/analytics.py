from datetime import datetime, timedelta, timezone
from typing import Any

STOP_WORDS = {
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
    "her", "was", "one", "our", "out", "day", "get", "has", "him", "his",
    "how", "man", "new", "now", "old", "see", "two", "way", "who", "with",
    "from", "this", "that", "have", "they", "your", "what", "would", "there",
}


def compute_analytics(
    fields: list[dict[str, Any]],
    events: list[dict[str, Any]],
    responses: list[dict[str, Any]],
    range_days: int = 14,
) -> dict[str, Any]:
    total_views = sum(1 for e in events if e["eventType"] == "view")
    total_starts = sum(1 for e in events if e["eventType"] == "start")
    total_submissions = len(responses)

    if total_starts:
        completion_rate = min(100, round((total_submissions / total_starts) * 100))
    elif total_views:
        completion_rate = round((total_submissions / total_views) * 100)
    else:
        completion_rate = 0

    times = [
        r["completionTimeSeconds"]
        for r in responses
        if isinstance(r.get("completionTimeSeconds"), (int, float)) and r["completionTimeSeconds"] > 0
    ]
    avg_completion_seconds = round(sum(times) / len(times)) if times else 0

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    responses_by_day = []
    for i in range(range_days - 1, -1, -1):
        day = today - timedelta(days=i)
        key = day.strftime("%Y-%m-%d")
        count = sum(
            1
            for r in responses
            if datetime.fromtimestamp(r["submittedAt"] / 1000, tz=timezone.utc).strftime("%Y-%m-%d") == key
        )
        responses_by_day.append({"date": key, "count": count})

    steps = sorted({f["step"] for f in fields if f.get("step", 0) > 0})
    dropoff_by_step = [
        {
            "step": step,
            "views": sum(1 for e in events if e["eventType"] == "step_view" and e.get("step") == step),
        }
        for step in steps
    ]

    input_fields = [f for f in fields if f["type"] not in ("section_heading", "page_break")]
    questions = [_question_stats(f, responses) for f in input_fields]

    return {
        "totalViews": total_views,
        "totalStarts": total_starts,
        "totalSubmissions": total_submissions,
        "completionRate": completion_rate,
        "avgCompletionSeconds": avg_completion_seconds,
        "responsesByDay": responses_by_day,
        "dropoffByStep": dropoff_by_step,
        "questions": questions,
    }


def _question_stats(field: dict[str, Any], responses: list[dict[str, Any]]) -> dict[str, Any]:
    values = [r["answers"].get(field["id"]) for r in responses]
    answered = sum(
        1
        for v in values
        if v is not None and v != "" and not (isinstance(v, list) and len(v) == 0)
    )
    q: dict[str, Any] = {
        "fieldId": field["id"],
        "type": field["type"],
        "label": field["label"],
        "answeredCount": answered,
        "emptyCount": len(responses) - answered,
    }
    ftype = field["type"]
    if ftype in ("single_choice", "multiple_choice", "dropdown"):
        options = (field.get("config") or {}).get("options") or []
        counts = {opt["value"]: 0 for opt in options}
        for v in values:
            if isinstance(v, list):
                for item in v:
                    counts[str(item)] = counts.get(str(item), 0) + 1
            elif v not in (None, "", []):
                counts[str(v)] = counts.get(str(v), 0) + 1
        q["choiceDistribution"] = [
            {"label": opt["label"], "count": counts.get(opt["value"], 0)} for opt in options
        ]
    if ftype == "rating":
        nums = [float(v) for v in values if _is_num(v) and float(v) > 0]
        if nums:
            q["ratingAverage"] = round(sum(nums) / len(nums), 1)
    if ftype == "nps":
        nums = [int(v) for v in values if _is_num(v) and 0 <= int(v) <= 10]
        if nums:
            promoters = sum(1 for n in nums if n >= 9)
            detractors = sum(1 for n in nums if n <= 6)
            passives = len(nums) - promoters - detractors
            q["npsScore"] = round(((promoters - detractors) / len(nums)) * 100)
            q["npsBreakdown"] = {"promoters": promoters, "passives": passives, "detractors": detractors}
    if ftype in ("short_text", "long_text"):
        recent, word_freq = [], {}
        for v in values:
            if not isinstance(v, str) or not v.strip():
                continue
            if len(recent) < 5:
                recent.append(v.strip())
            for w in _words(v):
                if len(w) > 3 and w not in STOP_WORDS:
                    word_freq[w] = word_freq.get(w, 0) + 1
        q["recentAnswers"] = recent
        q["topWords"] = sorted(word_freq.items(), key=lambda x: -x[1])[:8]
        q["topWords"] = [{"word": w, "count": c} for w, c in q["topWords"]]
    return q


def _is_num(v: Any) -> bool:
    try:
        float(v)
        return True
    except (TypeError, ValueError):
        return False


def _words(text: str) -> list[str]:
    import re
    return re.sub(r"[^\w\s]", " ", text.lower()).split()


def compute_funnel(events: list[dict[str, Any]], total_submissions: int) -> dict[str, Any]:
    step_counts: dict[int, int] = {}
    for e in events:
        if e["eventType"] == "step_view" and e.get("step") is not None:
            step_counts[e["step"]] = step_counts.get(e["step"], 0) + 1
    steps_sorted = sorted(step_counts.keys())
    first = step_counts.get(steps_sorted[0], 0) if steps_sorted else 0
    out = []
    for i, step in enumerate(steps_sorted):
        views = step_counts[step]
        prev = step_counts.get(steps_sorted[i - 1], views) if i > 0 else views
        out.append({
            "step": step,
            "views": views,
            "retention": round((views / first) * 100) if first else 0,
            "dropFromPrev": max(0, round(((prev - views) / prev) * 100)) if prev else 0,
        })
    completion_rate = round((total_submissions / first) * 100) if first else 0
    worst = max(out, key=lambda s: s["dropFromPrev"], default=None)
    return {
        "steps": out,
        "completionRate": completion_rate,
        "worstStep": worst["step"] if worst and worst["dropFromPrev"] > 0 else None,
    }


def compute_interaction_insights(
    fields: list[dict[str, Any]], events: list[dict[str, Any]]
) -> dict[str, Any]:
    by_field: dict[str, int] = {}
    error_by_field: dict[str, int] = {}
    drop_offs: dict[int, int] = {}
    session_step_times: dict[str, dict[int, float]] = {}
    last_by_session: dict[str, dict[str, Any]] = {}

    for e in events:
        et = e["eventType"]
        fid = e.get("fieldId")
        if et in ("field_focus", "field_change") and fid:
            by_field[fid] = by_field.get(fid, 0) + 1
        if et == "field_error" and fid:
            error_by_field[fid] = error_by_field.get(fid, 0) + 1
        if et == "drop_off" and e.get("step") is not None:
            drop_offs[e["step"]] = drop_offs.get(e["step"], 0) + 1
        if et == "step_view" and e.get("step") is not None and e.get("sessionId"):
            sid = e["sessionId"]
            last = last_by_session.get(sid)
            if last and last["step"] != e["step"]:
                elapsed = max(0, e["createdAt"] - last["ts"])
                session_step_times.setdefault(sid, {})
                session_step_times[sid][last["step"]] = session_step_times[sid].get(last["step"], 0) + elapsed
            last_by_session[sid] = {"step": e["step"], "ts": e["createdAt"]}

    labels = {f["id"]: f["label"] for f in fields}

    def top(m: dict[str, int]) -> tuple[str, int] | None:
        if not m:
            return None
        return max(m.items(), key=lambda x: x[1])

    ti = top(by_field)
    te = top(error_by_field)
    worst_step = max(drop_offs.items(), key=lambda x: x[1], default=None)

    step_sums: dict[int, dict[str, float]] = {}
    for sm in session_step_times.values():
        for step, ms in sm.items():
            step_sums.setdefault(step, {"sum": 0, "n": 0})
            step_sums[step]["sum"] += ms
            step_sums[step]["n"] += 1

    return {
        "mostInteractedField": (
            {"fieldId": ti[0], "label": labels.get(ti[0], ti[0]), "count": ti[1]} if ti else None
        ),
        "mostErroredField": (
            {"fieldId": te[0], "label": labels.get(te[0], te[0]), "count": te[1]} if te else None
        ),
        "worstStep": {"step": worst_step[0], "dropOffs": worst_step[1]} if worst_step else None,
        "avgTimePerStepSeconds": [
            {"step": s, "avgSeconds": round(v["sum"] / v["n"] / 1000) if v["n"] else 0}
            for s, v in sorted(step_sums.items())
        ],
    }
