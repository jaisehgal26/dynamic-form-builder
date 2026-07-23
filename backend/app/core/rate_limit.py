import time
from collections import defaultdict

import httpx
import redis

from app.core.config import settings

_buckets: dict[str, tuple[int, float]] = defaultdict(lambda: (0, 0.0))


def _redis_key(key: str) -> str:
    """Prefix keys so FormForge can share Upstash with QuickPad without collisions."""
    prefix = settings.redis_key_prefix
    return f"{prefix}rl:{key}" if prefix else f"rl:{key}"


def rate_limit(key: str, limit: int = 30, window_ms: int = 60_000) -> bool:
    """Return True if request is allowed."""
    if settings.upstash_redis_rest_url and settings.upstash_redis_rest_token:
        return _upstash_rate_limit(key, limit, window_ms)
    if settings.redis_url:
        return _redis_rate_limit(key, limit, window_ms)
    return _memory_rate_limit(key, limit, window_ms)


def _memory_rate_limit(key: str, limit: int, window_ms: int) -> bool:
    now = time.time() * 1000
    count, reset_at = _buckets[key]
    if reset_at < now:
        _buckets[key] = (1, now + window_ms)
        return True
    if count >= limit:
        return False
    _buckets[key] = (count + 1, reset_at)
    return True


def _redis_rate_limit(key: str, limit: int, window_ms: int) -> bool:
    try:
        client = redis.from_url(settings.redis_url or "")
        window_sec = max(1, window_ms // 1000)
        rkey = _redis_key(key)
        current = client.incr(rkey)
        if current == 1:
            client.expire(rkey, window_sec)
        return current <= limit
    except Exception:
        return _memory_rate_limit(key, limit, window_ms)


def _upstash_rate_limit(key: str, limit: int, window_ms: int) -> bool:
    try:
        window_sec = max(1, window_ms // 1000)
        rkey = _redis_key(key)
        url = settings.upstash_redis_rest_url
        token = settings.upstash_redis_rest_token
        headers = {"Authorization": f"Bearer {token}"}
        with httpx.Client(timeout=5.0) as client:
            incr = client.post(url + "/incr/" + rkey, headers=headers)
            count = incr.json().get("result", 1)
            if count == 1:
                client.post(
                    url + f"/expire/{rkey}/{window_sec}",
                    headers=headers,
                )
            return int(count) <= limit
    except Exception:
        return _memory_rate_limit(key, limit, window_ms)


def parse_device_from_ua(ua: str | None) -> dict[str, str]:
    if not ua:
        return {"device": "unknown", "browser": "unknown"}
    lower = ua.lower()
    device = "desktop"
    if any(x in lower for x in ("mobile", "iphone")) or (
        "android" in lower and "tablet" not in lower
    ):
        device = "mobile"
    elif "ipad" in lower or "tablet" in lower:
        device = "tablet"
    browser = "unknown"
    if "edg/" in lower:
        browser = "Edge"
    elif "chrome/" in lower and "edg/" not in lower:
        browser = "Chrome"
    elif "safari/" in lower and "chrome/" not in lower:
        browser = "Safari"
    elif "firefox/" in lower:
        browser = "Firefox"
    return {"device": device, "browser": browser}
