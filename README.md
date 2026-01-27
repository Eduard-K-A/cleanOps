# CleanOps

Production-ready service marketplace for cleaning jobs: real-time geolocation, Stripe Connect escrow, and job dispatching.

## Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind, Lucide, Shadcn-style UI, Zustand
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

See `backend/.env.example` for all variables. Stripe webhook: `POST /api/webhooks/stripe` (raw body, use Stripe CLI for local testing).

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_*, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev
```

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
2. **Employee feed:** `GET /api/jobs?feed=employee` (+ optional `lat`, `lng`) → open jobs by proximity. Claim → `PATCH /api/jobs/:id/claim`.
3. **Complete & pay:** Worker uploads proof → `PATCH /api/jobs/:id/proof`. Customer approves → `PATCH /api/jobs/:id/approve` → capture PaymentIntent → Transfer to worker (minus platform fee).

## Env summary

| Variable | Where | Purpose |
|----------|--------|---------|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | Backend + Frontend | DB and Auth |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Backend | Payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend | Stripe Elements |
| `ALLOWED_ORIGINS` | Backend | CORS |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL` | Frontend | API and Socket.io |
