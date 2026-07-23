# SDLC Agent Handoff Pipeline

FormForge feature work flows through six Cursor agents. Each agent reads the previous handoff file(s), does its work, and writes the next file. **Never skip a stage.**

Project context: FormForge — form builder SaaS migrating from Next.js Route Handlers to FastAPI + Next.js monorepo. See `docs/README.md` and `docs/architecture.md`.

```
User request
    ↓
① requirements-agent  →  active/01-requirements.md
    ↓
② scope-analyst       →  active/02-scope.md
    ↓
③ impact-analyst      →  active/03-impact.md
    ↓
④ implementer         →  active/04-implementation.md  (+ code changes)
    ↓
⑤ test-agent          →  active/05-test-report.md     (+ tests)
    ↓
⑥ ship-agent          →  active/06-ship-report.md
```

## Repo layers (scope tags)

| Tag | Path (current → target) |
|-----|-------------------------|
| `frontend` | `src/` → `frontend/` |
| `backend` | `src/app/api/` → `backend/` |
| `db` | `src/db/` → `backend/` (with API migration) |
| `infra` | deploy, env, docker |
| `docs` | `docs/` |

## How to use

1. Start a new feature: copy `templates/` into `active/` (or let the first agent create `01-requirements.md`).
2. Invoke agents in order via Cursor: `/requirements-agent`, `/scope-analyst`, etc.
3. Each agent **must read** prior handoff files before working.
4. When shipped, archive `active/` to `archive/<feature-name>/`.

## Active handoff files

| File | Owner agent | Purpose |
|------|-------------|---------|
| `01-requirements.md` | requirements-agent | What & why — user perspective |
| `02-scope.md` | scope-analyst | In/out scope, tasks, acceptance criteria |
| `03-impact.md` | impact-analyst | Risks, affected areas, dependencies |
| `04-implementation.md` | implementer | What was built, files changed, decisions |
| `05-test-report.md` | test-agent | Test plan, results, bugs, AC status |
| `06-ship-report.md` | ship-agent | Ship verdict and sign-off |

## Rules

- If a prior handoff file is missing or incomplete, **stop** and tell the user which agent to run first.
- Do not implement code before `03-impact.md` exists (unless user explicitly overrides).
- Do not ship before `05-test-report.md` says **Ready for ship review: yes**.
- Keep handoff docs concise — they are contracts between agents, not essays.
