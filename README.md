# Ticket Boss – Support Operations Dashboard

Ticket Boss is an internal operations console built with **Next.js 15**, **React 19**, **Prisma 6**, and **Tailwind CSS v4**. It gives support leads real-time visibility into ticket volume while providing agents a personal workspace to triage, update, and claim tickets.

![Ticket Boss Dashboard Preview](./banner.png)

---

## Highlights

- **Live ticket analytics** – server-side aggregates power the all-time/today metrics, adjustable goal tracker, per-brand donut (today vs all-time), issue comparison bars, and a 10-day timeline with timezone-aware labels.
- **Actionable ticket workspace** – horizontal cards with search, status/date filters, pagination, calendar picker, inline editing, delete/restore, and a background refresh loop that only re-renders when records actually change.
- **Today Ticket League** – leaderboard of every agent’s volume plus an “Unassigned” bucket so managers can spot unattended work.
- **Notifications + toasts** – dropdown feed that marks read on open, background polling, and real-time toast previews for new ticket events.
- **Profile + settings** – editable contact information, social links, and avatar uploader so internal data stays current.
- **Dark/light theme** – sticky sidebar/header chrome with hover states, keyboard search focus (`⌘/Ctrl + K`), and high-contrast tooltips across both themes.
- **Secure auth & sessions** – bcrypt password hashing, HttpOnly session tokens with 7-day TTL, and layout-level guards that redirect unauthenticated traffic.
- **Ticket ingestion API** – Chrome extension / webhook friendly endpoint that upserts by ticket id, accepts JSON transcripts, and can auto-assign by `ownerEmail`.

---

## Tech Stack

| Area        | Details                                                                  |
|-------------|--------------------------------------------------------------------------|
| Framework   | Next.js 15.2.3 (App Router, server/client components)                    |
| Language    | TypeScript + React 19                                                    |
| Styling     | Tailwind CSS v4 with custom tokens, utility classes, and theme contexts  |
| Data / ORM  | Prisma 6 + MySQL (shadow DB supported)                                   |
| Auth        | Custom sessions, bcrypt, secure cookies                                  |
| Charts      | ApexCharts (timeline + donut + gradients)                                |
| UI Toolkit  | Custom cards/forms + FullCalendar, react-dnd, dropzone, etc.             |

---

## Project Structure

```
src/
├─ app/               # Routes, layouts, API handlers
├─ components/        # Dashboard widgets, ticket cards, forms, dropdowns
├─ context/           # Theme + sidebar providers
├─ layout/            # Header, sidebar, backdrop shell
├─ lib/               # Prisma client, auth helpers, ticket utilities
├─ types/, hooks/, icons/ …
prisma/
├─ schema.prisma      # Ticket/User/Session/Notification models
public/
└─ images/, icons/, banner.png
```

---

## Getting Started

### 1. Prerequisites

- Node.js **>=18** (20+ recommended)
- pnpm 9+ (or npm/yarn if you prefer)
- MySQL 8+ database with a user that can create a shadow database

### 2. Install dependencies

```bash
pnpm install
```

### 3. Environment variables (`.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | MySQL connection string Prisma uses for reads/writes/migrations | `mysql://user:pass@localhost:3306/ticket_boss` |
| `DASHBOARD_TOKEN` | ✅ | Bearer token expected by `/api/tickets` ingestion endpoint | `super-secret-string` |
| `NEXT_PUBLIC_WORLDHOST_SUPPORT_INBOX_URL` | ⛔ optional | Overrides the fallback inbox link when we restore/import tickets | `https://admin.worldhost.group/admin/support/inbox` |

> 💡 Give the DB user `CREATE DATABASE` so Prisma can spin up its shadow database; otherwise run with a `shadowDatabaseUrl`.

### 4. Database

```bash
pnpm prisma migrate dev --name init   # create schema locally
pnpm prisma generate                  # regenerate client (usually auto)
```

### 5. Development & build scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run Next.js dev server on <http://localhost:3000> |
| `pnpm lint` | ESLint + Next.js recommended rules |
| `pnpm build` | Production build + type check |
| `pnpm start` | Serve the built app (`pnpm build` first) |
| `pnpm prisma migrate deploy` | Apply migrations in prod/CI |

---

## Authentication & Sessions

- Signup: `POST /api/auth/signup` with `{ email, password, firstName?, lastName? }`
- Login: `POST /api/auth/login` returns an HttpOnly `session-token`
- Logout: `POST /api/auth/logout`
- Profile: `GET/PUT /api/profile`

Sessions live in the `Session` table (7-day TTL). `AdminLayout` fetches the current user via `getCurrentUser()` and redirects to `/signin` if missing.

---

## Ticket API Cheat Sheet

```
POST /api/tickets      # upsert ticket from extension/webhook (requires DASHBOARD_TOKEN)
DELETE /api/tickets/:id  # soft delete if caller owns the ticket
POST /api/tickets/restore # bring a ticket back (used by recycle bin UI)
```

Payload example:

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $DASHBOARD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ACME-42",
    "brand": "Hosting.com",
    "clientName": "Acme Corp",
    "subject": "SSL renewal",
    "status": "open",
    "lastMessage": "Waiting on CSR",
    "ownerEmail": "agent@example.com",
    "clientMsgs": [{"ts":"2025-05-01T10:00:00Z","body":"Need help"}]
  }'
```

---

## Deployment (Vercel-ready)

1. **Ignore build artifacts** – `.next/` is already listed in `.gitignore`. If it was ever committed, run `git rm -r --cached .next` and commit the removal.
2. **Set env vars** in Vercel → Project Settings → Environment Variables (`DATABASE_URL`, `DASHBOARD_TOKEN`, optional inbox URL).
3. **Migrations** – run `pnpm prisma migrate deploy` against the production DB (Vercel build hooks or a separate deploy step).
4. **Import repo into Vercel** – Build command `pnpm build`, Output `.next`. Vercel auto-installs dependencies via pnpm.
5. **Verify** – run through dashboard + ticket workspace to ensure Prisma is connected and cookies work on your domain.

---

## Troubleshooting

| Issue | Suggested Fix |
|-------|---------------|
| Shadow DB errors (P3014/P1010) | Give the DB user `CREATE DATABASE` or configure `shadowDatabaseUrl`. |
| Ticket refresh loop never updates | Ensure `/api/dashboard/tickets` returns JSON and that `DASHBOARD_TOKEN` matches the sender. Check browser console for fetch errors. |
| Tooltip text invisible | Verify you are on the latest commit; CSS now forces light tooltip text to use `text-gray-900`. Clear cache if needed. |

---

## Publishing README Changes to GitHub

1. Edit this `README.md` locally (already done if you’re reading this section!).
2. Stage the file: `git add README.md`
3. Commit: `git commit -m "docs: refresh README"`
4. Push: `git push` (or `git push --set-upstream origin main` if you haven’t pushed this branch before).
5. Refresh the repository page on GitHub to see the updated README.

---

## License

MIT License – use it internally, fork it, or extend it for your org. Please keep attribution when distributing.

---

Questions or feature ideas? Open an issue and we’ll jam on it. 🚀
