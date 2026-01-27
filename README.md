# CleanOps

Production-ready service marketplace for cleaning jobs: real-time geolocation, Stripe Connect escrow, and job dispatching.

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind, Lucide, Shadcn-style UI, Zustand, Supabase Auth
- **Backend:** Node.js, Express, Supabase (PostgreSQL + Auth), Socket.io, Stripe Connect, node-cron

## Setup

### 1. Database (Supabase)

1. Create a [Supabase](https://supabase.com) project and enable PostGIS.
2. Run migrations in order:

```bash
# Supabase CLI or SQL editor
supabase db push
# Or run manually: 001 → 002 → 003 → 004 → 005
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill SUPABASE_*, STRIPE_*, ALLOWED_ORIGINS
npm install
npm run dev
```

Backend runs on `http://localhost:5000` (API under `/api`, health check at `/health`).

See `backend/.env.example` for all variables. Stripe webhook: `POST /api/webhooks/stripe` (raw body, use Stripe CLI for local testing).

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_*, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### 4. Accounts / Roles

- **Customer vs Employee**: some endpoints are role-protected (e.g. employee job feed).
- **Signup**: the signup page lets you choose an **Account type** (`customer` or `employee`) and stores it in the Supabase `profiles` table.

### 4. Stripe Connect

- Use **Custom** Connect accounts for workers.
- Create PaymentIntents with `capture_method: 'manual'` (escrow). Capture on customer approval, then Transfer to connected account.
- Configure webhook for `payment_intent.succeeded`, etc.

## Structure

- `backend/` — Express API, Socket.io, cron, Stripe webhooks
- `frontend/` — Next.js App Router, Supabase Auth, booking flow, job feed
- `supabase/migrations/` — Schema, RLS, RPCs

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## Main flows

1. **Book & escrow:** Customer completes multi-step form → `POST /api/jobs` → Stripe PaymentIntent (manual capture) → redirect to payment page → authorize card.
2. **Employee feed:** `GET /api/jobs/feed` → open jobs by proximity. Claim → `POST /api/jobs/claim`.
3. **Complete & pay:** Worker uploads proof → `PATCH /api/jobs/:job_id/status` (`PENDING_REVIEW` + `proof_of_work`) → customer approves → `POST /api/jobs/:job_id/approve` → capture PaymentIntent → Transfer to worker (minus platform fee).

## Troubleshooting

- **403 Forbidden on `/api/jobs/feed`**
  - You are authenticated, but your `profiles.role` is not `employee`. Sign up as an employee (or update the profile role in Supabase).
- **`net::ERR_CONNECTION_REFUSED` calling the API**
  - The backend is not running or crashed. Restart `backend` and check the server logs.
- **500 "Failed to create job"**
  - Usually Stripe is not configured. Ensure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set to valid values (test keys are fine for local).

## Env summary

| Variable | Where | Purpose |
|----------|--------|---------|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | Backend + Frontend | DB and Auth |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Backend | Payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend | Stripe Elements |
| `ALLOWED_ORIGINS` | Backend | CORS |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL` | Frontend | API and Socket.io |
