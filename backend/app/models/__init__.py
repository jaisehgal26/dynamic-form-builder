from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    forms: Mapped[list["Form"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (Index("users_email_idx", "email", unique=True),)


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="draft")
    schema_json: Mapped[dict] = mapped_column(JSON, nullable=False, server_default="{}")
    theme_json: Mapped[dict] = mapped_column(JSON, nullable=False, server_default="{}")
    settings_json: Mapped[dict] = mapped_column(JSON, nullable=False, server_default="{}")
    password_hash: Mapped[str | None] = mapped_column(String)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    response_limit: Mapped[int | None] = mapped_column(Integer)
    collect_email: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="forms")
    fields: Mapped[list["FormField"]] = relationship(back_populates="form", cascade="all, delete-orphan")
    responses: Mapped[list["FormResponse"]] = relationship(back_populates="form", cascade="all, delete-orphan")
    events: Mapped[list["FormEvent"]] = relationship(back_populates="form", cascade="all, delete-orphan")

    __table_args__ = (
        Index("forms_slug_idx", "slug", unique=True),
        Index("forms_user_idx", "user_id"),
        Index("forms_status_idx", "status"),
    )


class FormField(Base):
    __tablename__ = "form_fields"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    form_id: Mapped[str] = mapped_column(String, ForeignKey("forms.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    placeholder: Mapped[str | None] = mapped_column(String)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    step: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    config_json: Mapped[dict] = mapped_column(JSON, nullable=False, server_default="{}")
    validation_json: Mapped[dict] = mapped_column(JSON, nullable=False, server_default="{}")
    logic_json: Mapped[list] = mapped_column(JSON, nullable=False, server_default="[]")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    form: Mapped["Form"] = relationship(back_populates="fields")

    __table_args__ = (
        Index("form_fields_form_idx", "form_id"),
        Index("form_fields_form_pos_idx", "form_id", "position"),
    )


class FormResponse(Base):
    __tablename__ = "form_responses"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    form_id: Mapped[str] = mapped_column(String, ForeignKey("forms.id", ondelete="CASCADE"))
    respondent_id: Mapped[str | None] = mapped_column(String)
    respondent_email: Mapped[str | None] = mapped_column(String)
    answers_json: Mapped[dict] = mapped_column(JSON, nullable=False, server_default="{}")
    metadata_json: Mapped[dict] = mapped_column(JSON, nullable=False, server_default="{}")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completion_time_seconds: Mapped[int | None] = mapped_column(Integer)

    form: Mapped["Form"] = relationship(back_populates="responses")

    __table_args__ = (
        Index("form_responses_form_idx", "form_id"),
        Index("form_responses_submitted_idx", "submitted_at"),
    )


class FormEvent(Base):
    __tablename__ = "form_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    form_id: Mapped[str] = mapped_column(String, ForeignKey("forms.id", ondelete="CASCADE"))
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    step: Mapped[int | None] = mapped_column(Integer)
    field_id: Mapped[str | None] = mapped_column(String)
    session_id: Mapped[str | None] = mapped_column(String)
    metadata_json: Mapped[dict] = mapped_column(JSON, nullable=False, server_default="{}")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    form: Mapped["Form"] = relationship(back_populates="events")

    __table_args__ = (
        Index("form_events_form_idx", "form_id"),
        Index("form_events_type_idx", "event_type"),
        Index("form_events_session_idx", "session_id"),
        Index("form_events_field_idx", "field_id"),
        Index("form_events_created_idx", "created_at"),
    )
