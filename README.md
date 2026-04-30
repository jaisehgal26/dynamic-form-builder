# FormForge

A production-grade form builder SaaS — Google Forms / Typeform style. Build forms with drag-and-drop, conditional logic, multi-step flows, real-time analytics, and CSV exports.

Built with:

- **Next.js 15** (App Router, RSC, Route Handlers)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui** + **lucide-react**
- **Zustand** for builder state
- **Drizzle ORM** + **Turso / libSQL** for data
- **Recharts** for analytics charts
- **Zod** for validation
- **JOSE** + **bcryptjs** for auth (HttpOnly JWT cookies)
- **dnd-kit** for drag-and-drop reordering
- **Sonner** for toast notifications

Deploy target: **Vercel**.

---

## ⚠️ Important: do not edit files in OneDrive without committing first

Earlier in this project, OneDrive's sync wiped most source files. To prevent that from happening again:

1. **Commit early, commit often** — `git add -A && git commit -m "checkpoint"`.
2. **Pause OneDrive sync** while building, or move the project outside `OneDrive/`.
3. Don't open binary files like `local.db` in your editor.

---

## Features

- Email/password authentication with HttpOnly JWT cookies and protected dashboard routes
- Dashboard with totals, conversion rate, search, duplicate, delete, and copy public link
- Drag-and-drop form builder with **inline editing**, live preview, autosave (debounced), JSON schema export/import
- 14 field types: short text, long text, email, phone, number, date, single/multiple/dropdown choice, rating, NPS, file upload placeholder, section heading, page break
- Per-field validation rules (length, regex, min/max, custom messages)
- Conditional logic (show/hide/jump-to-step)
- Multi-step forms with progress bar, back/next navigation, step-level analytics
- Public form pages (`/f/[slug]`) — mobile-first, branded, accessible
- Form events: view / start / step_view / submit
- Server-side response validation, in-memory rate limiter, metadata capture (UA, device, browser, referrer, IP)
- Responses table with detail view, individual delete, CSV export
- Analytics dashboard: views, starts, submissions, completion rate, avg completion time, responses-by-day chart, drop-off chart, per-question analytics including choice distribution, rating average, NPS score & breakdown

---

## Quickstart

### 1. Install

```bash
npm install
```

> An `.npmrc` in the repo sets `legacy-peer-deps=true` so Vercel and local installs don't fail on third-party Radix/dnd-kit peer deps that haven't yet bumped to React 19.

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

```env
# Local dev — uses an embedded SQLite file (no Turso account needed):
DATABASE_URL=file:./local.db

# Production — Turso libSQL (https://turso.tech):
# DATABASE_URL=libsql://your-database-name.turso.io
# DATABASE_AUTH_TOKEN=eyJhbGciOi...

# Generate with: openssl rand -base64 32
AUTH_SECRET=replace-with-a-secure-random-string-at-least-32-chars

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Local SQLite is great for development. **For production on Vercel, use Turso/libSQL** — Vercel's serverless functions cannot persist local SQLite files.

### 3. Run migrations

```bash
npm run db:generate   # only when schema changes
npm run db:migrate    # apply migrations
```

### 4. (Optional) Seed demo data

```bash
npm run db:seed
```

This creates a demo user (`demo@formforge.app` / `password123`) with one published "Customer Feedback" form.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start built server
npm run lint         # ESLint
npm run typecheck    # TypeScript --noEmit

npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema (dev only)
npm run db:studio    # Drizzle Studio
npm run db:seed      # Seed demo data
```

---

## Project Structure

```
src/
  app/
    (auth)/login, signup           Auth pages with shared layout
    api/
      auth/                        Signup, login, logout, me
      forms/[formId]/              CRUD, publish, duplicate, schema, fields, responses, analytics
      public/forms/[slug]/         Public payload, events, responses
    dashboard/
      page.tsx                     Forms list + stats
      forms/new/                   Quick-create
      forms/[formId]/builder/      Form builder
      forms/[formId]/responses/    Responses table + detail
      forms/[formId]/analytics/    Analytics dashboard
    f/[slug]/                      Public form page
    page.tsx                       Landing page
  components/
    analytics/                     Metric cards, charts, dashboard
    builder/                       Palette, canvas, editor, preview, logic, settings
    dashboard/                     Forms list, create dialog, responses
    layout/                        AppShell, sidebar, header
    public-form/                   PublicFormRenderer, FieldRenderer
    ui/                            shadcn primitives + common components
  db/
    schema.ts                      Drizzle tables
    client.ts                      libSQL client + drizzle instance
    migrate.ts                     Migration runner
    seed.ts                        Seed script
    migrations/                    Generated SQL
  hooks/                           Custom hooks (use-debounce)
  lib/
    auth.ts                        Sessions, password hashing, JWT
    auth-constants.ts              Edge-safe cookie name (used by middleware)
    api.ts                         API helpers (errors, rate-limit, UA parsing)
    analytics.ts                   Analytics computation
    csv.ts                         CSV serialization
    forms.server.ts                Server-only DB helpers
    form-helpers.ts                Field defaults, logic eval, step grouping
    slug.ts                        ID/slug generation
    utils.ts                       cn(), formatters
    validations.ts                 Zod schemas
  stores/
    use-builder-store.ts           Zustand builder state
  types/
    form.ts                        Form/field domain types
    response.ts                    Response/analytics types
  middleware.ts                    Protected route guard
```

---

## Form Schema (JSON)

A form serializes to:

```json
{
  "title": "Customer Feedback",
  "description": "Help us improve",
  "settings": {
    "multiStep": true,
    "showProgressBar": true,
    "allowMultipleSubmissions": true,
    "thankYouMessage": "Thanks for submitting!"
  },
  "theme": {
    "primaryColor": "#0a0a0a",
    "backgroundColor": "#ffffff",
    "font": "Inter"
  },
  "fields": [
    {
      "id": "field_xxx",
      "type": "short_text",
      "label": "What's your name?",
      "required": true,
      "step": 1,
      "position": 0,
      "config": {},
      "validation": { "minLength": 2, "maxLength": 100 },
      "logic": []
    }
  ]
}
```

You can export/import this JSON from the builder's **Schema** dialog.

---

## API Reference

### Auth

| Method | Path                | Body / Notes                       |
| ------ | ------------------- | ---------------------------------- |
| POST   | `/api/auth/signup`  | `{ name, email, password }`        |
| POST   | `/api/auth/login`   | `{ email, password }`              |
| POST   | `/api/auth/logout`  | —                                  |
| GET    | `/api/auth/me`      | Returns current user or null       |

### Forms (authenticated)

| Method | Path                                         | Notes                                |
| ------ | -------------------------------------------- | ------------------------------------ |
| GET    | `/api/forms`                                 | List user's forms with stats         |
| POST   | `/api/forms`                                 | `{ title, description? }`            |
| GET    | `/api/forms/[formId]`                        | Single form with fields              |
| PATCH  | `/api/forms/[formId]`                        | `{ title?, description?, status? }`  |
| DELETE | `/api/forms/[formId]`                        | Delete form (cascade)                |
| POST   | `/api/forms/[formId]/duplicate`              | Clone form                           |
| POST   | `/api/forms/[formId]/publish`                | Set status to `published`            |
| POST   | `/api/forms/[formId]/unpublish`              | Set status to `draft`                |
| PATCH  | `/api/forms/[formId]/schema`                 | Replace full schema (used by builder)|
| POST   | `/api/forms/[formId]/fields`                 | Create one field                     |
| PATCH  | `/api/forms/[formId]/fields/[fieldId]`       | Update one field                     |
| DELETE | `/api/forms/[formId]/fields/[fieldId]`       | Delete one field                     |
| PATCH  | `/api/forms/[formId]/fields/reorder`         | `{ order: string[] }`                |
| GET    | `/api/forms/[formId]/responses`              | Responses list                       |
| GET    | `/api/forms/[formId]/responses/[responseId]` | Single response                      |
| DELETE | `/api/forms/[formId]/responses/[responseId]` | Delete response                      |
| GET    | `/api/forms/[formId]/responses/export`       | CSV download                         |
| GET    | `/api/forms/[formId]/analytics`              | Computed analytics                   |

### Public

| Method | Path                                       | Notes                                       |
| ------ | ------------------------------------------ | ------------------------------------------- |
| GET    | `/api/public/forms/[slug]`                 | Returns published form payload              |
| POST   | `/api/public/forms/[slug]/events`          | `{ eventType, step?, metadata? }`           |
| POST   | `/api/public/forms/[slug]/responses`       | `{ answers, startedAt?, metadata? }`        |

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Create a Turso database: `turso db create formforge`.
3. Get the URL and an auth token: `turso db show formforge` & `turso db tokens create formforge`.
4. In Vercel, set environment variables:
   - `DATABASE_URL` (`libsql://…`)
   - `DATABASE_AUTH_TOKEN`
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (your deployed URL)
5. Run `npm run db:migrate` once locally against the Turso URL to provision tables.
6. Deploy.

---

## License

MIT — use this however you like.
