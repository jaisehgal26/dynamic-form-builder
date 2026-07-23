# FormForge

A production-grade form builder SaaS — Google Forms / Typeform style.

## Monorepo structure

```
formforge/
├── frontend/          # Next.js 15 — UI (Vercel)
├── backend/           # FastAPI — REST API (Vercel Python)
├── docker-compose.yml # Local Postgres + Redis
├── vercel.json        # Single Vercel project config
└── docs/
```

## Quickstart (local)

### 1. Start database

```bash
docker compose up -d db redis
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1    # Windows
pip install -r requirements.txt
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API requests proxy to `localhost:8000`.

Demo login after seed: `demo@formforge.app` / `password123`

## Production (Vercel + Neon)

1. Create a **Neon** Postgres project — use the **pooler** connection string as `DATABASE_URL`
2. Create **Upstash Redis** for rate limiting (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
3. Deploy the repo to **Vercel** (root directory `.`)
4. Set env vars: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, Upstash vars
5. Run `alembic upgrade head` against Neon once before first deploy
6. Optional: `python scripts/migrate-sqlite-to-pg.py` to migrate existing SQLite data

## Scripts

```bash
# Backend
cd backend && pytest
cd backend && alembic upgrade head
cd backend && python scripts/seed.py

# Frontend
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm run typecheck
```

See [docs/architecture.md](docs/architecture.md) for full API and deployment details.
