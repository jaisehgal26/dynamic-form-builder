from datetime import datetime
from typing import Any


def csv_escape(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        s = "; ".join(str(v) for v in value)
    elif isinstance(value, dict):
        import json
        s = json.dumps(value)
    else:
        s = str(value)
    if any(c in s for c in '",\n\r'):
        return '"' + s.replace('"', '""') + '"'
    return s


def responses_to_csv(fields: list[dict[str, Any]], rows: list[dict[str, Any]]) -> str:
    input_fields = [f for f in fields if f["type"] not in ("section_heading", "page_break")]
    header = [
        "Response ID",
        "Submitted At",
        "Started At",
        "Completion Time (s)",
        *[f["label"] for f in input_fields],
    ]
    lines = [",".join(csv_escape(h) for h in header)]
    for row in rows:
        values = [
            row["id"],
            datetime.fromtimestamp(row["submittedAt"] / 1000).isoformat(),
            datetime.fromtimestamp(row["startedAt"] / 1000).isoformat() if row.get("startedAt") else "",
            row.get("completionTimeSeconds") or "",
            *[row["answers"].get(f["id"]) for f in input_fields],
        ]
        lines.append(",".join(csv_escape(v) for v in values))
    return "\n".join(lines)
