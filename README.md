# CleanOps

A full-stack service marketplace for cleaning jobs featuring real-time geolocation, mock money escrow system, job dispatching, and a Supabase-powered backend.

## Stack

- **Frontend:** Next.js 16.1 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons, Shadcn-style UI components, Zustand, Supabase Auth, React Hooks
- **Backend:** Supabase (PostgreSQL + PostGIS), Supabase Auth, Supabase Realtime, Server Actions
- **Infrastructure:** Database Triggers, RLS Policies

## Prerequisites

- Node.js 18+ and npm/bun
- [Supabase account](https://supabase.com) with a project created
- PostGIS extension enabled in your Supabase project

## Setup

### 1. Supabase Configuration

1. Create a [Supabase](https://supabase.com) project
2. Enable PostGIS extension in the database (via Supabase Dashboard → Database → Extensions)
3. Run migrations in order:
   ```bash
   # From supabase/migrations/ directory
   # Run SQL files in order: 001 → 002 → ...
   # Or use Supabase CLI: supabase db push
   ```

4. Configure environment variables:
   - Get `NEXT_PUBLIC_SUPABASE_URL` from your Supabase project settings
   - Get `NEXT_PUBLIC_SUPABASE_ANON_KEY` for frontend
   - Get `SUPABASE_SERVICE_ROLE_KEY` for server-side operations

### 2. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
# Fill in your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### 3. User Roles & Onboarding

- **Account Types:** Users choose between `customer` or `employee` during signup, while an `admin` role manages the platform.
- **Customer:** Browse jobs, create job bookings, manage orders, message employees, pay via the mock money system.
- **Employee:** View job feed based on proximity, claim jobs, submit work proof, message customers, receive payment.
- **Admin:** Access full platform overview, view analytics, manage user accounts, review content in a specialized queue, configure settings.
- **Profiles Table:** Stores user metadata including role, money balance, location, ratings.
- **Onboarding:** New employees complete a setup flow before accessing the realtime job feed.

## Architecture

### Supabase-Powered Backend (No Express Server)

```
Frontend (Next.js)
    ↓
Server Actions (Next.js App Router layer)
    ↓
Supabase Client (TypeScript)
    ├→ PostgreSQL Database
    ├→ Supabase Auth
    ├→ Realtime Subscriptions
    └→ RLS Policies (Security)
```

**Key Components:**

- **Server Actions** (`app/actions/`) - Handle all data operations server-side securely.
  - `auth.ts` - Authentication & signup
  - `jobs.ts` - Job creation, claiming, completion
  - `messages.ts` - Chat messaging
  - `payments.ts` - Money & balance operations

- **Supabase Functions** - Stored procedures for complex operations
  - `claim_job()` - Job claiming logic
  - `release_escrow()` - Payment processing
  - `get_nearby_jobs()` - Proximity-based job discovery
  - `add_money()` - Balance management

- **RLS Policies** - Row-level security for data isolation
  - Users can only access their own data
  - Employees only see open nearby jobs
  - Customers can only manage their jobs
  - Admins can access platform-wide data securely

### Frontend Architecture

```
app/
├── login/ & signup/ - Authentication flows
├── customer/        - Customer dashboards (dashboard, jobs, messages, order, payment, requests)
├── employee/        - Employee dashboards (dashboard, feed, history, jobs, messages)
├── admin/           - Admin panels (dashboard, analytics, jobs, review-queue, users, settings)
├── actions/         - Server Actions for data operations
└── api/             - Route handlers

lib/
├── api/             - Advanced API optimization layer
│   ├── cache.ts - Multi-layer caching
│   ├── requestQueue.ts - Prioritization
│   ├── requestDeduplication.ts
│   ├── retry.ts
│   ├── performance.ts 
│   ├── optimistic.ts
│   └── prefetch.ts
├── supabase/        - Supabase client configurations
└── hooks/           - Custom React hooks
    ├── useAsyncData.ts
    ├── useJobDetail.ts
    ├── useOptimisticMutation.ts
    └── realtime/    - Supabase Realtime (useJobFeed, useJobMessages, useJobUpdates)
```

- `frontend/` — Next.js 16 application with App Router, Server Actions, UI components, Tailwind 4.
- `supabase/` — Database migrations, schema, RLS policies, stored functions.

## Core Flows

### 1. User Signup & Authentication
```text
1. User fills signup form (email, password, role)
2. Server Action calls: signUp(formData)
3. Supabase Auth creates user account
4. User redirected to onboarding (if not completed)
5. Profile created via auth trigger or first login
```
**Location:** `app/signup/page.tsx` → `app/actions/auth.ts`

### 2. Add Money to Account
```text
1. User clicks profile button → Balance section
2. Enters amount and confirms
3. Server Action calls: addMoney(amount)
4. Supabase function `add_money()` updates balance
5. Transaction recorded in money_transactions table
```
**Location:** UI Component → `app/actions/payments.ts`

### 3. Create & Book a Job (Customer)
```text
1. Customer navigates to booking form
2. Selects property size, tasks, urgency, location
3. System calculates price based on urgency
4. Server Action calls: createJob(jobData)
5. Money held in escrow from customer balance
6. Job status set to OPEN
7. Redirect to confirmation page
```
**Location:** `app/customer/requests/page.tsx` or `/order` → `app/actions/jobs.ts`

### 4. Job Discovery & Claiming (Employee)
```text
1. Employee views job feed with real-time updates
2. Hook `useJobFeed()` loads nearby jobs via Supabase Realtime
3. Jobs sorted by proximity using postgis `get_nearby_jobs()` RPC
4. Employee clicks "Claim Job"
5. Server Action calls: claimJob(jobId)
6. Supabase function `claim_job()` sets worker_id and status to IN_PROGRESS
```
**Location:** `app/employee/feed/page.tsx` → `app/actions/jobs.ts`

### 5. Submit Work Proof & Complete Job
```text
1. Employee uploads proof of work (images)
2. Server Action calls: updateJobStatus(jobId, PENDING_REVIEW, proofImages)
3. Job status changes to PENDING_REVIEW
4. Customer receives notification and can approve/reject
5. If approved: Server Action calls: approveJobCompletion(jobId)
6. Supabase function `release_escrow()` transfers payment to employee
7. Job status set to COMPLETED
```
**Location:** `app/employee/jobs/page.tsx` → `app/actions/jobs.ts`

### 6. Admin Supervision
```text
1. Admin logs in and views the Platform Overview Dashboard
2. Real-time metrics show active user count, job volume, and revenue
3. Admin navigates to the Review Queue to check reported jobs or disputed completions
4. Can directly override decisions or manage user accounts via users tab
```
**Location:** `app/admin/dashboard/page.tsx` & `app/admin/review-queue/page.tsx`

### 7. Real-Time Messaging
```text
1. Customer and employee can message within a job
2. Hook `useJobMessages()` subscribes to Supabase Realtime messages table
3. New messages appear instantly
4. Server Action calls: sendMessage(jobId, content)
5. Message inserted into messages table via RLS policy
```
**Location:** `components/chat/ChatWindow.tsx` → `app/actions/messages.ts`

## Performance Features

### API Optimization Layer (`lib/api/`)
- **Caching:** Multi-layer cache (memory + localStorage) with TTL
- **Request Deduplication:** Prevents duplicate concurrent requests
- **Request Queue:** Prioritizes requests (critical, high, medium, low)
- **Retry Logic:** Exponential backoff for failed requests
- **Performance Monitoring:** Tracks metrics, p50/p95/p99 latencies, cache hit rates
- **Prefetching:** Smooth pagination and hover prefetching
- **Optimistic Updates:** Immediate UI feedback before server confirmation

### Real-Time Updates (Supabase Realtime)
- Jobs feed updates automatically when new jobs posted
- Job status changes reflected across all clients
- Messages appear instantly in chat windows
- Notifications sent via database triggers (optional)

## Troubleshooting

### 403 Forbidden on Job Feed
**Cause:** Not authenticated or user role is not `employee`
**Fix:** 
- Ensure you're logged in
- Sign up as an `employee` (not customer)
- Verify `profiles.role` in Supabase dashboard

### 401 Unauthorized / "Not authenticated"
**Cause:** Supabase session expired or not initialized
**Fix:**
- Log out and log back in
- Check browser console for auth errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

### "Insufficient balance" when creating job
**Cause:** User doesn't have enough mock money for job
**Fix:**
- Add mock money via profile → Balance section
- Amount must be ≥ job price (includes platform fee)

### Real-time updates not working
**Cause:** Supabase Realtime not connected or RLS blocking access
**Fix:**
- Check browser console for Supabase connection errors
- Verify RLS policies allow user to subscribe to relevant tables
- Refresh the page to reconnect

### Job not appearing in employee feed
**Cause:** Job is not OPEN status, or user is outside radius
**Fix:**
- Verify job status is OPEN in Supabase dashboard
- Check job location and employee location (default: 50km radius)
- Ensure employee has completed onboarding

### Type errors in `@ts-expect-error` comments
**Cause:** Supabase SDK type inference limitations with dynamic table operations
**Info:** These are runtime-safe but require type suppression. They work correctly in production.

## Environment Variables

### Frontend (`.env.local`)

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous API key (public) |

### Server-Side (Next.js Secrets)

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Note:** Service role key is only used server-side for elevated privileges. Never expose to client.

## API Endpoints

The application no longer uses REST API endpoints. All data operations go through:

1. **Server Actions** - Secure server-side operations in `app/actions/`
2. **Supabase Client** - Direct database queries with RLS protection
3. **Supabase Realtime** - WebSocket subscriptions for live data

This eliminates the need for traditional REST API endpoints and provides better security through Row-Level Security policies.

## Key Features

### 🔐 Security & Authentication
- Supabase Auth with email/password
- Row-Level Security (RLS) policies for data isolation
- Server-side authentication checks
- Session management via HTTP-only cookies

### 📍 Location & Job Discovery
- PostGIS-powered proximity search (`get_nearby_jobs` RPC)
- Configurable search radius (default: 50km)
- Real-time job feed for employees
- Location-based job recommendations

### 💰 Mock Money System
- User account balance with transaction history
- Escrow system for job payments
- 85/15 split: 85% to worker, 15% platform fee
- Instant balance updates

### 🔄 Real-Time Features
- Supabase Realtime subscriptions for live job feed
- Instant job status updates
- Real-time messaging between customer & employee
- Live notification system

### 📱 Responsive UI
- Mobile-first design with Tailwind CSS v4
- Responsive grid layouts
- Touch-friendly buttons and forms
- Dark/light mode support (optional)

### ⚡ Performance & Admin Capabilities
- Skeleton loaders for smooth, perceived performance across Admin and Dashboard interfaces
- Advanced metrics tracking & analytics through the new Admin portal
- Smart caching with memory + localStorage
- Optimistic UI updates to hide network latency

## Database Schema

### Core Tables
- **users** (via Supabase Auth) - Authentication & user accounts
- **profiles** - User metadata, balance, location, ratings
- **jobs** - Job listings with status, location, pricing
- **messages** - Chat messages between users
- **notifications** - User notifications
- **money_transactions** - Transaction history

### Key RPC Functions
- `add_money(user_id, amount)` - Add balance
- `claim_job(p_job_id, p_employee_id)` - Claim job with worker assignment
- `release_escrow(p_job_id, p_employee_id, p_amount, p_platform_fee)` - Process payment
- `get_nearby_jobs(lat, lng, radius_meters)` - Find nearby open jobs

### Key Indexes
- `jobs.status` - Quick filtering by job status
- `jobs.location` - GiST index for PostGIS queries
- `profiles.location` - User location index
- `messages.job_id` - Message lookups by job

## Development

### Running Locally

```bash
# Frontend development server
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000

# Watch for TypeScript errors
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

### Building for Production

```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Database Development

```bash
# View migrations
ls supabase/migrations/

# Create new migration (using Supabase CLI)
supabase migration new migration_name

# Reset local database
supabase db reset

# Push changes to production
supabase db push
```

## Migration from Express Backend

This project was migrated from an Express.js + Socket.io backend to a Supabase-only architecture:

**Changes:**
- ❌ Removed: Express API server
- ❌ Removed: Socket.io for real-time
- ❌ Removed: node-cron for background jobs
- ✅ Added: Next.js Server Actions
- ✅ Added: Supabase Realtime subscriptions
- ✅ Added: Database triggers for automation
- ✅ Added: Advanced API client optimization layer

**Benefits:**
- Simplified deployment (no separate backend server)
- Better security with RLS policies
- Lower latency with edge functions
- Real-time updates out of the box
- Easier scaling with Supabase

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Ensure TypeScript types are correct: `npm run type-check`
4. Lint code: `npm run lint`
5. Commit with clear messages
6. Push and create a pull request

## License

Private project - CleanOps Service Marketplace
