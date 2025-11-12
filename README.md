# Ticket Boss – Support Operations Dashboard

Ticket Boss is an internal-facing operations dashboard built with **Next.js 15**, **React 19**, **Prisma**, and **Tailwind CSS v4**. It centralizes live ticket feeds (ingested via API/extension), helps support agents manage their own workload, and surfaces team-wide insights such as brand performance and the “Today Ticket League”.

![Ticket Boss Dashboard Preview](./banner.png)

---

## Key Features

- **Secure email + password auth** with bcrypt hashing, session tokens, and HttpOnly cookies.
- **Personal ticket workspace** with horizontal cards, calendar/date filtering, status filters, pagination, and owner-aware delete/claim actions.
- **Dashboard analytics** including all-time vs today counts, adjustable daily goal tracker, brand breakdown (today vs all time) with tooltips, ticket activity timeline, and today-vs-yesterday performance.
- **Today Ticket League** that ranks every signed-in user’s ticket count and highlights unassigned tickets still waiting to be claimed.
- **Profile editor** so each agent can maintain contact information, biography, and upload their own avatar.
- **Ticket ingestion API** designed for the Chrome extension or other systems. Upserts by ticket id, supports brand/client metadata, JSON payloads, and optional automatic assignment through `ownerEmail`.
- **Dark/light mode**, responsive layout, and cleaned-up navigation (Dashboard, Tickets, KPI placeholder, Tools placeholder, Today Ticket League).

---

## Tech Stack

| Area            | Choices                                                                 |
|-----------------|-------------------------------------------------------------------------|
| Framework       | Next.js 15.2.3 (App Router, Server & Client Components)                 |
| Language        | TypeScript + React 19                                                   |
| Styling         | Tailwind CSS v4, CSS modules, custom design tokens                      |
| Data / ORM      | Prisma 6 + MySQL                                                        |
| Auth            | Custom session tokens, bcrypt password hashing                          |
| Charts & UI     | ApexCharts, FullCalendar, custom cards/forms                            |

---

## Repository Layout

```
src/
├─ app/                     # App Router routes (dashboard, auth, API endpoints)
├─ components/              # Reusable UI (cards, charts, profile widgets, forms)
├─ layout/                  # Sidebar + header chrome
├─ lib/                     # Prisma client, auth helpers
├─ icons/, context/, etc.   # Supporting utilities
prisma/
└─ schema.prisma            # Ticket, User, Session models
public/images/logo/         # Ticket Boss logomark (chart icon)
```

---

## Getting Started

### 1. Prerequisites

- Node.js **18+** (20+ recommended)
- pnpm 9+ (or npm/yarn if you prefer)
- MySQL 8 (or compatible Aurora/RDS). The Prisma schema expects a MySQL connection string.

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Configure Environment Variables

Create a `.env` file with at least:

| Variable          | Description                                                                                   | Example |
|-------------------|-----------------------------------------------------------------------------------------------|---------|
| `DATABASE_URL`    | Prisma connection string for MySQL. User must have permission to create a shadow database.    | `mysql://user:password@localhost:3306/new_support` |
| `DASHBOARD_TOKEN` | Shared secret used by the `/api/tickets` endpoint (Chrome extension / webhook ingestion).     | `super-long-random-token` |

⛑️ **Tip:** When running migrations locally, grant the database user the `CREATE DATABASE` privilege so Prisma can create its shadow DB. Otherwise you’ll see `P3014/P1010` errors.

### 4. Database Setup

```bash
# Create / migrate schema
pnpm prisma migrate dev --name init

# Generate the Prisma client (automatically run by migrate, but safe to repeat)
pnpm prisma generate
```

### 5. Run the App

```bash
pnpm dev        # start next dev server on http://localhost:3000
pnpm build      # production build (also runs lint/type-check)
pnpm start      # run compiled app (after pnpm build)
```

---

## Authentication & Sessions

- **Signup**: `POST /api/auth/signup` with `{ email, password, firstName?, lastName? }`.
- **Login**: `POST /api/auth/login` with `{ email, password }`. Successful responses set an HttpOnly `session-token`.
- **Logout**: `POST /api/auth/logout`.
- **Profile**: `GET/PUT /api/profile` to retrieve/update personal data (bio, socials, avatar URL, contact info).

Sessions are stored in the `Session` table with a 7-day expiry. Cookies are managed server-side via the `attachSessionCookie` helper in `src/lib/auth.ts`.

---

## Ticket Ingestion API

Endpoint: `POST /api/tickets`

- Protected by the `DASHBOARD_TOKEN` header (`Authorization: Bearer <token>`).
- Upserts tickets by `id`.
- Accepts optional `ownerId` or `ownerEmail` to auto-link records to a user.
- Stores structured JSON for `clientMsgs` / `agentMsgs`.

Sample payload:

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DASHBOARD_TOKEN" \
  -d '{
    "id": "ABC-123-456",
    "brand": "TicketBoss",
    "clientName": "Acme Corp",
    "subject": "Login lockout",
    "status": "open",
    "lastMessage": "Customer replied via portal",
    "date": "2025-04-05T08:15:00Z",
    "ownerEmail": "agent@example.com",
    "clientMsgs": [{"ts":"2025-04-05T08:00:00Z","body":"Need help"}]
  }'
```

Related endpoints:

- `GET /api/tickets` – quick inspection feed (dev only, CORS open for local extension).
- `DELETE /api/tickets/:id` – removes a ticket **if** it belongs to the signed-in user or is currently unassigned.

---

## Pages & Modules

- `/` – Main dashboard (Ticket metrics, timeline chart, brand breakdown toggle, daily goal tracker, ticket activity).
- `/dashboard/tickets` – Ticket card view with filters, calendar picker, pagination, and per-ticket actions.
- `/today-league` – Leaderboard of today’s ticket counts per user plus an unassigned bucket.
- `/profile` – Editable profile + avatar upload.
- `/kpi`, `/tools` – Placeholders ready for future build-out.
- `/signin`, `/signup` – Auth pages rendered by `src/app/(full-width-pages)/(auth)`.

---

## Project Scripts

| Script            | What it does                                             |
|-------------------|----------------------------------------------------------|
| `pnpm dev`        | Runs Next.js in development mode                         |
| `pnpm build`      | Production build + lint/type checks                      |
| `pnpm start`      | Serves the built app (`.next`)                           |
| `pnpm lint`       | ESLint (Next.js config)                                  |
| `pnpm prisma ...` | Prisma CLI (migrate, studio, generate, etc.)             |

---

## Deployment Checklist

1. Set `DATABASE_URL` and `DASHBOARD_TOKEN` in your hosting environment.
2. Run `pnpm prisma migrate deploy` against the production database.
3. Build & start the app (`pnpm build && pnpm start`) or use your platform’s adapter.
4. Ensure your reverse proxy forwards HTTPS so cookies stay `secure`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Prisma Migrate could not create the shadow database (P3014/P1010)` | Grant your DB user `CREATE DATABASE` privileges or set `shadowDatabaseUrl` to a database where the user has rights. |
| Cannot delete tickets from the Chrome extension feed | Only the ticket owner (or unassigned tickets) can be deleted. Either claim the ticket first or adjust the API logic to permit admin overrides. |
| Login button appears unresponsive | Ensure the `/api/auth/login` call succeeds and that cookies are allowed (some browser extensions block third-party cookies on `localhost`). Check devtools network tab for errors. |

---

## License

This project is released under the MIT License. Feel free to adapt it for your own support organization—just keep the attribution if you distribute it publicly.

---

Need a hand extending Ticket Boss (extra analytics, integrations, or deployment help)? Open an issue or start a discussion! 🚀
