"""Seed demo data for FormForge."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime, timezone

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Form, FormField, User
from app.services.forms import DEFAULT_SETTINGS, DEFAULT_THEME
from app.utils.ids import generate_field_id, generate_form_slug, generate_id


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "demo@formforge.app").first()
        if existing:
            print("Seed data already exists.")
            return

        user_id = generate_id("user")
        user = User(
            id=user_id,
            name="Demo User",
            email="demo@formforge.app",
            password_hash=hash_password("password123"),
        )
        db.add(user)

        form_id = generate_id("form")
        now = datetime.now(timezone.utc)
        settings = {
            **DEFAULT_SETTINGS,
            "multiStep": True,
            "thankYouMessage": "Thanks for the feedback — we read every response.",
        }
        form = Form(
            id=form_id,
            user_id=user_id,
            title="Customer Feedback",
            description="Help us understand what you love and what we can improve.",
            slug=generate_form_slug("Customer Feedback"),
            status="published",
            schema_json={},
            theme_json=DEFAULT_THEME,
            settings_json=settings,
            published_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add(form)

        fields = [
            ("short_text", "What's your name?", 1, 0, True, "Jane Doe"),
            ("email", "What's your email?", 1, 1, True, None),
            ("rating", "How would you rate your experience?", 2, 2, True, None),
            ("long_text", "What can we improve?", 2, 3, False, "Tell us what you think…"),
        ]
        for ftype, label, step, pos, required, placeholder in fields:
            config = {}
            if ftype == "rating":
                config = {"maxRating": 5, "ratingIcon": "star"}
            db.add(
                FormField(
                    id=generate_field_id(),
                    form_id=form_id,
                    type=ftype,
                    label=label,
                    placeholder=placeholder,
                    required=required,
                    position=pos,
                    step=step,
                    config_json=config,
                    created_at=now,
                    updated_at=now,
                )
            )

        db.commit()
        print("Seed complete.")
        print("Login as: demo@formforge.app / password123")
    finally:
        db.close()


if __name__ == "__main__":
    main()
