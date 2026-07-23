#!/usr/bin/env python3
"""One-time migration from SQLite (local.db) to PostgreSQL."""

import json
import os
import sqlite3
import sys
from datetime import datetime, timezone

import psycopg2
from psycopg2.extras import execute_values

SQLITE_PATH = os.environ.get("SQLITE_PATH", "local.db")
PG_URL = os.environ.get("DATABASE_URL")
if not PG_URL:
    print("Set DATABASE_URL to target Postgres")
    sys.exit(1)


def ms_to_ts(ms: int | None) -> datetime | None:
    if ms is None:
        return None
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


def main() -> None:
    if not os.path.exists(SQLITE_PATH):
        print(f"SQLite file not found: {SQLITE_PATH}")
        sys.exit(1)

    conn_sqlite = sqlite3.connect(SQLITE_PATH)
    conn_sqlite.row_factory = sqlite3.Row
    pg = psycopg2.connect(PG_URL)
    pg.autocommit = False
    cur = pg.cursor()

    users = conn_sqlite.execute("SELECT * FROM users").fetchall()
    execute_values(
        cur,
        """INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
           VALUES %s ON CONFLICT (id) DO NOTHING""",
        [(r["id"], r["name"], r["email"], r["password_hash"], ms_to_ts(r["created_at"]), ms_to_ts(r["updated_at"])) for r in users],
    )

    forms = conn_sqlite.execute("SELECT * FROM forms").fetchall()
    for r in forms:
        cur.execute(
            """INSERT INTO forms (id, user_id, title, description, slug, status, schema_json, theme_json,
               settings_json, password_hash, expires_at, response_limit, collect_email, created_at, updated_at, published_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
            (
                r["id"], r["user_id"], r["title"], r["description"], r["slug"], r["status"],
                r["schema_json"] if isinstance(r["schema_json"], dict) else json.loads(r["schema_json"] or "{}"),
                json.loads(r["theme_json"] or "{}"),
                json.loads(r["settings_json"] or "{}"),
                r["password_hash"], ms_to_ts(r["expires_at"]), r["response_limit"], bool(r["collect_email"]),
                ms_to_ts(r["created_at"]), ms_to_ts(r["updated_at"]), ms_to_ts(r["published_at"]),
            ),
        )

    fields = conn_sqlite.execute("SELECT * FROM form_fields").fetchall()
    for r in fields:
        cur.execute(
            """INSERT INTO form_fields (id, form_id, type, label, description, placeholder, required, position, step,
               config_json, validation_json, logic_json, created_at, updated_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
            (
                r["id"], r["form_id"], r["type"], r["label"], r["description"], r["placeholder"],
                bool(r["required"]), r["position"], r["step"],
                json.loads(r["config_json"] or "{}"),
                json.loads(r["validation_json"] or "{}"),
                json.loads(r["logic_json"] or "[]"),
                ms_to_ts(r["created_at"]), ms_to_ts(r["updated_at"]),
            ),
        )

    responses = conn_sqlite.execute("SELECT * FROM form_responses").fetchall()
    for r in responses:
        cur.execute(
            """INSERT INTO form_responses (id, form_id, respondent_id, respondent_email, answers_json, metadata_json,
               started_at, submitted_at, completion_time_seconds)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
            (
                r["id"], r["form_id"], r["respondent_id"], r["respondent_email"],
                json.loads(r["answers_json"] or "{}"),
                json.loads(r["metadata_json"] or "{}"),
                ms_to_ts(r["started_at"]), ms_to_ts(r["submitted_at"]), r["completion_time_seconds"],
            ),
        )

    events = conn_sqlite.execute("SELECT * FROM form_events").fetchall()
    for r in events:
        cur.execute(
            """INSERT INTO form_events (id, form_id, event_type, step, field_id, session_id, metadata_json, created_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
            (
                r["id"], r["form_id"], r["event_type"], r["step"], r["field_id"], r["session_id"],
                json.loads(r["metadata_json"] or "{}"),
                ms_to_ts(r["created_at"]),
            ),
        )

    pg.commit()
    conn_sqlite.close()
    pg.close()
    print("Migration complete.")


if __name__ == "__main__":
    main()
