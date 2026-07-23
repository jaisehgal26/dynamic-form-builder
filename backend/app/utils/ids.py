import re
import secrets
import string

_ALPHABET = string.digits + string.ascii_lowercase


def generate_id(prefix: str | None = None) -> str:
    part = "".join(secrets.choice(_ALPHABET) for _ in range(16))
    return f"{prefix}_{part}" if prefix else part


def slugify(text: str) -> str:
    s = (text or "").lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:60]


def generate_form_slug(title: str) -> str:
    base = slugify(title) or "form"
    short = "".join(secrets.choice(_ALPHABET) for _ in range(6))
    return f"{base}-{short}"


def generate_field_id() -> str:
    return "field_" + "".join(secrets.choice(_ALPHABET) for _ in range(12))
