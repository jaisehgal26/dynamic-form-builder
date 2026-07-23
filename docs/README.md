# FormForge Documentation

Production-grade form builder SaaS — drag-and-drop builder, conditional logic, multi-step flows, analytics, CSV export.

## Repo layout

```
formforge/
├── frontend/            # Next.js 15 (Vercel)
├── backend/             # FastAPI + SQLAlchemy + Alembic (Vercel Python)
├── docker-compose.yml   # Local Postgres + Redis
├── vercel.json          # Monorepo deploy config
├── scripts/             # dev.ps1, migrate-sqlite-to-pg.py
└── docs/
```

See [architecture.md](./architecture.md) for stack boundaries and API map.

## Stack

| Layer | Tech | Location |
|-------|------|----------|
| API | FastAPI, Pydantic, SQLAlchemy | `backend/` |
| Web | Next.js 15, TypeScript, Tailwind, shadcn/ui | `frontend/` |
| DB (local) | PostgreSQL 16 (Docker) | `docker-compose.yml` |
| DB (prod) | Neon Postgres | `DATABASE_URL` env |
| Rate limits (prod) | Upstash Redis | `UPSTASH_REDIS_*` env |

## Commands

```bash
# Local infrastructure
docker compose up -d db redis

# Backend
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Or from repo root (matches Vercel routing)
vercel dev

# Tests
cd backend && pytest
cd frontend && npm run typecheck && npm run build
```

## SDLC pipeline

See [handoffs/README.md](./handoffs/README.md).
