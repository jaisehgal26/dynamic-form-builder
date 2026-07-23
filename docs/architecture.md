# FormForge Architecture

Form builder SaaS. **Monorepo** with Next.js frontend and FastAPI backend, deployed together on Vercel.

## Layout

| Path | Role |
|------|------|
| `frontend/` | Next.js App Router — pages, components, middleware |
| `backend/` | FastAPI REST API — `endpoint → service → repository` |
| `docs/` | Architecture, SDLC handoffs |
| `.cursor/` | Agents and coding rules |

## Stack

| Layer | Tech | Location |
|-------|------|----------|
| Web | Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui | `frontend/` |
| API | FastAPI, Pydantic, SQLAlchemy 2, Alembic | `backend/` |
| DB (local) | PostgreSQL 16 via Docker | `docker-compose.yml` |
| DB (prod) | Neon Postgres (pooler URL) | `DATABASE_URL` |
| Auth | JWT HttpOnly cookies (`ff_session`) | `backend/app/core/security.py` |
| Rate limits | Redis (local) / Upstash (prod, shared with QuickPad) | `backend/app/core/rate_limit.py` — keys use `formforge:` prefix |

## Request flow

```
Browser → Vercel
  /dashboard/*, /f/*  →  Next.js (frontend/)
  /api/*              →  FastAPI (backend/app/main.py)
                            ↓
                       Neon Postgres
```

Local dev: `frontend` rewrites `/api/*` → `http://localhost:8000` when not on Vercel.

## Backend structure

```
backend/app/
  main.py
  api/v1/endpoints/   # auth, forms, fields, responses, analytics, public
  core/               # config, database, security, deps, rate_limit
  models/             # SQLAlchemy ORM (5 tables)
  services/           # forms, analytics, export
  utils/              # id/slug generation
```

## Frontend API access

- **Client components:** `fetch('/api/...')` (same origin)
- **Server components:** `serverFetch()` in `frontend/src/lib/server-api.ts`

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection (Neon pooler in prod) |
| `AUTH_SECRET` | JWT signing (shared frontend middleware + backend) |
| `REDIS_URL` | Local rate limiting |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | Prod rate limiting (shared Upstash OK) |
| `REDIS_KEY_PREFIX` | Redis namespace (`formforge:` — avoids QuickPad collisions) |
| `API_URL` | Server-side fetch target (default `http://localhost:8000`) |
| `NEXT_PUBLIC_APP_URL` | App base URL |

## Migrations

Run `alembic upgrade head` from `backend/` against target DB — never on serverless cold start.

Data migration from SQLite: `python scripts/migrate-sqlite-to-pg.py` (set `SQLITE_PATH`, `DATABASE_URL`).
