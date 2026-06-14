# ParkSafe Webapp

Privacy-first vehicle contact platform. Owners attach a QR tag to their car; strangers scan it and anonymously alert the owner (WhatsApp or call) about parking issues — **without ever seeing the owner's phone number**.

Built as a **pnpm monorepo** with a Next.js frontend, Hono API backend, and provider-agnostic PostgreSQL (Drizzle ORM). Custom JWT auth with OTP verification — no Supabase, no vendor lock-in.

---

## Table of Contents

- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the App](#running-the-app)
- [Dev Modes](#dev-modes)
- [Demo Data & Test Flows](#demo-data--test-flows)
- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Testing](#testing)
- [Scripts Reference](#scripts-reference)
- [Privacy & Security](#privacy--security)
- [Production Checklist](#production-checklist)

---

## Architecture

```
Browser (apps/web :3000)
    │
    │  /backend/*  →  Next.js rewrite proxy
    ▼
Hono API (apps/api :3001)
    │
    ├── Services      (business logic)
    ├── Repositories  (Drizzle queries)
    └── PostgreSQL    (via DATABASE_URL)
```

**Golden rule:** The frontend never talks to the database directly. All data flows through the API.

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, Zustand, React Query |
| Backend | Hono.js, Zod validation, custom JWT (`jose`) |
| Database | PostgreSQL + Drizzle ORM (any provider via `DATABASE_URL`) |
| OTP | Redis (Upstash) + WhatsApp via AiSensy — in-memory fallback in dev mode |
| Contact relay | AiSensy WhatsApp (templates) + Exotel (calls) |

---

## Monorepo Structure

```
parksafe-webapp/
├── apps/
│   ├── web/                 # Next.js frontend (UI only)
│   │   ├── app/             # Pages and routes
│   │   ├── components/      # React components
│   │   └── lib/api/         # Typed fetch wrappers → /backend/*
│   │
│   └── api/                 # Hono backend (all business logic)
│       ├── src/routes/      # HTTP endpoints (thin handlers)
│       ├── src/services/    # Business logic
│       ├── src/repositories/# Database access (Drizzle)
│       └── src/middleware/  # Auth, rate limiting, CORS
│
└── packages/
    ├── db/                  # Schema, migrations, seed scripts
    │   ├── src/schema.ts    # Table definitions
    │   └── src/migrations/  # SQL migration files
    └── types/               # Shared TypeScript types & Zod schemas
```

| Package | Purpose | Secrets? |
|---|---|---|
| `apps/api/.env` | API runtime config | Yes — your main config file |
| `apps/web/.env` | Frontend API URL only | No database credentials |
| `packages/db` | Schema + migrations | Reads `DATABASE_URL` at run time only |

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **PostgreSQL** ≥ 14 (local or any hosted provider)

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd parksafe-webapp
pnpm install
```

### 2. Configure environment

```bash
# API — copy and fill in your values
cp apps/api/.env.example apps/api/.env

# Web — copy and adjust if needed
cp apps/web/.env.example apps/web/.env
```

At minimum for local dev, set in `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/parksafe
JWT_ACCESS_SECRET=<32+ char random string>
JWT_REFRESH_SECRET=<32+ char random string>
PII_ENCRYPTION_KEY=<32+ char random string>
OTP_HMAC_SECRET=<32+ char random string>
SESSION_SIGNING_SECRET=<32+ char random string>
ALLOWED_ORIGIN=http://localhost:3000
OTP_DEV_MODE=true
```

Generate secrets:

```bash
openssl rand -base64 32
```

### 3. Create the database

```bash
# In psql or any Postgres client
CREATE DATABASE parksafe;
```

### 4. Run migrations and seed demo data

```bash
cd packages/db

# Set DATABASE_URL (or export from apps/api/.env)
export DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/parksafe

pnpm db:migrate
pnpm db:seed
```

### 5. Start development servers

```bash
# From repo root — starts web (:3000) + api (:3001)
pnpm dev
```

### 6. Verify

| Check | URL / Action |
|---|---|
| API health | http://localhost:3001/health |
| Contact flow | http://localhost:3000/contact/test-tag-uuid-001 |
| Owner sign-in | http://localhost:3000/sign-in → phone `9876543210` → OTP in API terminal |

---

## Environment Variables

### `apps/api/.env` — Backend (required)

| Variable | Required when | Description |
|---|---|---|
| `DATABASE_URL` | `OTP_DEV_MODE=false` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | `OTP_DEV_MODE=false` | Signs short-lived access tokens (≥32 chars) |
| `JWT_REFRESH_SECRET` | `OTP_DEV_MODE=false` | Signs refresh token metadata (≥32 chars) |
| `PII_ENCRYPTION_KEY` | `OTP_DEV_MODE=false` | AES-256-GCM encryption for phone numbers (≥32 chars) |
| `OTP_HMAC_SECRET` | Always | HMAC hashing for phone lookups (≥32 chars) |
| `SESSION_SIGNING_SECRET` | Always | Session/reporter hash signing (≥32 chars) |
| `ALLOWED_ORIGIN` | Always | CORS origin (e.g. `http://localhost:3000`) |
| `PORT` | Optional | API port (default `3001`) |
| `OTP_DEV_MODE` | Optional | `true` = dev mode (default), `false` = production path |
| `UPSTASH_REDIS_REST_URL` | `OTP_DEV_MODE=false` | Redis for OTP storage |
| `UPSTASH_REDIS_REST_TOKEN` | `OTP_DEV_MODE=false` | Redis auth token |
| `WHATSAPP_PROVIDER` | `OTP_DEV_MODE=false` | `aisensy` (default) or `meta` |
| `AISENSY_API_KEY` | `WHATSAPP_PROVIDER=aisensy` | AiSensy API key |
| `AISENSY_CAMPAIGN_*` | `WHATSAPP_PROVIDER=aisensy` | Live API campaign names (see `.env.example`) |
| `WHATSAPP_*` | `WHATSAPP_PROVIDER=meta` | Meta Graph API credentials |
| `EXOTEL_*` | Optional | Call relay |
| `DATABASE_URL_TEST` | Optional | Override integration test DB (default: `parksafe_test`) |

See `apps/api/.env.example` for the full template.

### `apps/web/.env` — Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL for SSR (default `http://localhost:3001`) |
| `NEXT_PUBLIC_DEV_SKIP_AUTH` | `true` = auto-login to dev dashboard user |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional analytics |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional error tracking |

The web app has **no** `DATABASE_URL` and **no** Supabase keys.

---

## Database Setup

### Migrations

Migrations live in `packages/db/src/migrations/`. The migrate script applies Drizzle journal migrations plus manual SQL files (`002`–`004`).

```bash
cd packages/db
DATABASE_URL=postgresql://... pnpm db:migrate
```

| Migration | Purpose |
|---|---|
| Drizzle journal | Base tables (`users`, `vehicles`, `tags`, `contact_events`, etc.) |
| `002_dashboard_profile.sql` | `user_settings`, `reporter_user_id` on contact events |
| `003_custom_auth.sql` | Removes Supabase RLS policies |
| `004_phone_and_sessions.sql` | `phone_encrypted`, `auth_sessions` table |
| `005_tag_batches.sql` | Admin QR batch generation |
| `006_remove_sms_channel.sql` | Drops `notify_sms` columns (WhatsApp + Call only) |

### Seed (demo data)

```bash
cd packages/db
DATABASE_URL=postgresql://... pnpm db:seed
```

Safe to re-run — uses `onConflictDoNothing`.

### Drizzle Studio (optional)

```bash
cd packages/db
DATABASE_URL=postgresql://... pnpm db:studio
```

### Schema changes

1. Edit `packages/db/src/schema.ts`
2. `pnpm db:generate` (in `packages/db`)
3. Review generated SQL
4. `pnpm db:migrate`

---

## Running the App

```bash
# Both apps (recommended)
pnpm dev

# Individual apps
cd apps/api && pnpm dev    # API on :3001 (loads apps/api/.env automatically)
cd apps/web && pnpm dev    # Web on :3000
```

The API dev script uses `node --env-file=.env` so `DATABASE_URL` and secrets are loaded on startup.

### Build for production

```bash
pnpm build
cd apps/api && pnpm start
cd apps/web && pnpm start
```

---

## Dev Modes

Controlled by `OTP_DEV_MODE` in `apps/api/.env`.

### `OTP_DEV_MODE=true` (default — fast local dev)

| Feature | Behavior |
|---|---|
| OTP delivery | Printed to API terminal (no WhatsApp API) |
| Redis | In-memory (no Upstash needed) |
| Auth sessions | Dev tokens (`dev-session:...`) |
| Database | Connected if `DATABASE_URL` is set; seed data usable |
| AiSensy/WhatsApp | Not required |

### `OTP_DEV_MODE=false` (production path)

| Feature | Behavior |
|---|---|
| OTP delivery | Real WhatsApp via AiSensy templates |
| Redis | Upstash (required) |
| Auth sessions | JWT access + opaque refresh tokens in `auth_sessions` |
| Database | PostgreSQL required |
| WhatsApp | AiSensy (default) or Meta direct — all campaign env vars required |

---

## Demo Data & Test Flows

After `pnpm db:seed`:

| Field | Value |
|---|---|
| Owner | Seed Owner |
| Phone | `+919876543210` (enter `9876543210` in UI) |
| Active tag | `test-tag-uuid-001` |
| Vehicles | Maruti Swift (tagged), Hyundai Creta |

### Contact flow (no login required)

```
http://localhost:3000/contact/test-tag-uuid-001
```

Shows the Maruti Swift card → pick issue → pick channel → relay to owner.

### Owner sign-in

1. Go to http://localhost:3000/sign-in
2. Enter `9876543210`
3. Check the **API terminal** for the OTP:
   ```
   [otp.dev] OTP for hash abc123…: 976329
   ```
4. Enter the OTP → dashboard loads with **Seed Owner** and 2 vehicles

### Registration (new owner)

```
http://localhost:3000/register
```

Creates a real user in Postgres (when `DATABASE_URL` is set).

---

## API Overview

Base URL: `http://localhost:3001` (browser uses `/backend` proxy)

### Public routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/auth/request-otp` | Send OTP to phone |
| `POST` | `/auth/verify-otp` | Verify OTP only |
| `POST` | `/auth/sign-in` | Sign in with OTP → tokens |
| `POST` | `/auth/sign-in/check` | Check if phone is registered |
| `POST` | `/auth/refresh` | Rotate refresh token |
| `POST` | `/auth/logout` | Revoke refresh token |
| `POST` | `/registration/*` | Owner onboarding |
| `GET` | `/tags/:tagCode` | Public tag lookup (masked vehicle info) |
| `POST` | `/contact/relay` | Send anonymous alert to owner |

### Authenticated routes (Bearer token required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboard` | Owner dashboard summary |
| `GET` | `/profile` | Owner profile |
| `PATCH` | `/profile` | Update profile/settings |
| `GET` | `/vehicles` | List owner vehicles |
| `POST` | `/vehicles` | Add vehicle |
| `PATCH` | `/tags/:tagId` | Update tag preferences |

---

## Authentication

Custom JWT auth — no third-party auth provider.

```
Sign-in flow:
  Phone → OTP (Redis) → verify → issue accessToken + refreshToken

Token refresh:
  accessToken expires → POST /auth/refresh → new token pair (rotation)

Reuse detection:
  Old refresh token reused → entire session family revoked
```

| Token | Type | Lifetime | Storage |
|---|---|---|---|
| Access token | JWT (`jose`) | 15 min (default) | `localStorage` + Zustand |
| Refresh token | Opaque (hashed in DB) | 30 days (default) | `localStorage` + `auth_sessions` table |

**Key files:**

| File | Purpose |
|---|---|
| `apps/api/src/services/auth.service.ts` | JWT sign/verify, refresh rotation |
| `apps/api/src/repositories/sessions.repository.ts` | `auth_sessions` table |
| `apps/web/lib/store/authStore.ts` | Browser token storage |
| `apps/web/lib/api/client.ts` | Silent refresh on 401 |

---

## Testing

```bash
# Unit tests (no database required)
cd apps/api && pnpm test          # 34 tests — auth, OTP, middleware
cd apps/web && pnpm test          # 53 tests — components, hooks, API client

# Integration tests (requires Postgres)
cd apps/api && pnpm test:integration   # 10 tests — login, register, contact, vehicle

# Type checking (entire monorepo)
pnpm type-check

# E2E (Playwright)
cd apps/web && pnpm test:e2e
```

### Integration tests and your dev database

Integration tests use a **separate database** and will **never wipe your dev data**:

```
parksafe       ← your dev data (safe)
parksafe_test  ← integration tests only (truncated during tests)
```

The test runner auto-derives `parksafe_test` from your `DATABASE_URL`. Override with `DATABASE_URL_TEST` if needed. A safety guard refuses to `TRUNCATE` any database whose name does not end with `_test`.

When running integration tests, pass your dev `DATABASE_URL` — the helper creates and migrates `parksafe_test` automatically:

```bash
cd apps/api
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/parksafe pnpm test:integration
```

Unit tests (`pnpm test`) never touch any database.

---

## Scripts Reference

### Root (`package.json`)

| Script | Description |
|---|---|
| `pnpm dev` | Start web + API in parallel (Turbo) |
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit tests across monorepo |
| `pnpm test:integration` | Run integration tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm type-check` | TypeScript check all packages |
| `pnpm lint` | ESLint all packages |
| `pnpm format` | Prettier format |

### `packages/db`

| Script | Description |
|---|---|
| `pnpm db:migrate` | Apply all migrations |
| `pnpm db:seed` | Insert demo data |
| `pnpm db:generate` | Generate migration from schema changes |
| `pnpm db:studio` | Open Drizzle Studio |

### `apps/api`

| Script | Description |
|---|---|
| `pnpm dev` | Start API with hot reload (loads `.env`) |
| `pnpm test` | Unit tests |
| `pnpm test:integration` | Postgres integration tests |

### `apps/web`

| Script | Description |
|---|---|
| `pnpm dev` | Start Next.js on :3000 |
| `pnpm test` | Vitest component/unit tests |
| `pnpm test:e2e` | Playwright E2E tests |

---

## Privacy & Security

- **Phone numbers** are never stored in plain text — HMAC hash for lookups, AES-256-GCM encryption for relay
- **License plates** are encrypted at rest
- **Contact relay** decrypts owner phone server-side only; reporters never see it
- **Tag lookup** returns masked vehicle info only (make, model, colour, partial plate)
- **Row-level security** removed from Postgres — ownership enforced in API middleware
- **Rate limiting** on contact relay endpoints
- **Refresh token rotation** with reuse detection

---

## Production Checklist

- [ ] Set `OTP_DEV_MODE=false` in `apps/api/.env`
- [ ] Generate strong secrets (≥32 chars) for all JWT/encryption keys
- [ ] Configure Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- [ ] Configure AiSensy (`AISENSY_API_KEY` + all `AISENSY_CAMPAIGN_*` vars) — see `apps/api/docs/AISENSY.md`
- [ ] Or Meta direct: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_ID` with `WHATSAPP_PROVIDER=meta`
- [ ] Set `ALLOWED_ORIGIN` to your production domain
- [ ] Run `pnpm db:migrate` against production `DATABASE_URL`
- [ ] Set `NEXT_PUBLIC_API_URL` to production API URL in `apps/web/.env`
- [ ] Remove `NEXT_PUBLIC_DEV_SKIP_AUTH` or set to `false`
- [ ] Run `pnpm build` and deploy API + web separately
- [ ] Verify `/health` endpoint responds
- [ ] Test full sign-in → dashboard → contact relay flow

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `password authentication failed` | Check `DATABASE_URL` credentials in `apps/api/.env` |
| Tag lookup returns 404 | Restart `pnpm dev` — API must load `.env` for `DATABASE_URL` |
| OTP not received | In dev mode, check the **API terminal** (not WhatsApp). In prod, verify AiSensy campaigns are Live |
| Sign-in says "not registered" | Run `pnpm db:seed` or register via `/register` |
| Integration tests wiped my data | Update to latest code — tests now use `parksafe_test` only |
| `ALLOWED_ORIGIN` validation error | Ensure it is set in `apps/api/.env` (must be a valid URL) |

---

## License

Private — Tribly / ParkSafe. All rights reserved.
"" 
