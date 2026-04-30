# CleanOps Copilot Instructions

## Build, Test, and Lint Commands

### Running the Application

```bash
cd frontend

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Testing and Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting (if available)
npm run format

# Run tests (using Vitest)
npm test

# Run single test file
npm test -- path/to/test.ts

# Run tests in watch mode
npm test -- --watch
```

### Database Migrations

```bash
# View existing migrations
ls supabase/migrations/

# Create a new migration (Supabase CLI required)
supabase migration new migration_name

# Push migrations to production
supabase db push

# Reset local database
supabase db reset
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 16.1 (App Router), TypeScript, Tailwind CSS v4, React 18.2
- **Backend**: Supabase (PostgreSQL + PostGIS) - **no Express server**
- **Authentication**: Supabase Auth (email/password)
- **Real-time**: Supabase Realtime subscriptions
- **UI Components**: Shadcn-style components built with Radix UI primitives
- **State Management**: Zustand
- **Testing**: Vitest with Testing Library
- **Linting**: ESLint with Next.js config

### Core Architecture Pattern

This is a **Supabase-first architecture**:

```
Frontend (Next.js App Router)
    ↓
Server Actions (app/actions/)
    ↓
Supabase Client
    ├→ PostgreSQL Database
    ├→ Supabase Auth
    ├→ Realtime Subscriptions
    └→ RLS Policies (enforce row-level security)
```

**No REST API endpoints exist**. All data operations flow through:
1. **Server Actions** - Secure server-side operations
2. **Supabase Client** - Direct database queries with automatic RLS protection
3. **Supabase Realtime** - WebSocket subscriptions for live data

### Project Structure

```
frontend/
├── app/
│   ├── actions/          # Server Actions for all data operations
│   │   ├── auth.ts       # Signup, signin, logout
│   │   ├── jobs.ts       # Job creation, claiming, completion
│   │   ├── messages.ts   # Chat messaging
│   │   ├── payments.ts   # Balance and escrow operations
│   │   ├── admin.ts      # Admin-only operations
│   │   ├── reports.ts    # Analytics and reporting
│   │   └── storage.ts    # File uploads
│   ├── customer/         # Customer pages (dashboard, jobs, orders, messages)
│   ├── employee/         # Employee pages (feed, history, jobs, messages)
│   ├── admin/            # Admin pages (dashboard, analytics, review-queue, users)
│   ├── auth/             # Authentication pages (login, signup)
│   ├── api/              # API route handlers (webhook receivers)
│   └── layout.tsx        # Root layout with providers
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks
│   ├── useAsyncData.ts   # Fetch with caching, retry, dedup
│   ├── useOptimisticMutation.ts  # Optimistic UI updates
│   ├── useJobDetail.ts   # Job details loading
│   └── realtime/         # Supabase Realtime subscriptions
├── lib/
│   ├── api/              # Advanced API optimization layer
│   │   ├── cache.ts      # Multi-layer memory + localStorage caching
│   │   ├── requestQueue.ts        # Request prioritization
│   │   ├── requestDeduplication.ts  # Prevent duplicate concurrent requests
│   │   ├── retry.ts      # Exponential backoff retry
│   │   ├── performance.ts  # Performance metrics tracking
│   │   ├── optimistic.ts  # Optimistic update patterns
│   │   ├── prefetch.ts   # Hover/pagination prefetching
│   │   └── optimizedClient.ts  # Wrapper combining all optimizations
│   ├── supabase/         # Supabase client setup
│   │   ├── client.ts     # Browser Supabase client
│   │   ├── server.ts     # Server-side Supabase client
│   │   └── middleware.ts # Auth session middleware
│   └── utils.ts          # Helper utilities
├── stores/               # Zustand global state
│   ├── bookingStore.ts
│   └── notificationStore.tsx
├── types/
│   └── index.ts          # TypeScript type definitions
├── middleware.ts         # Next.js middleware (auth session updates)
└── tsconfig.json         # TypeScript configuration with @ path aliases

supabase/
└── migrations/           # SQL migration files (numbered: 001_*, 002_*, etc.)
```

### Key Path Aliases (tsconfig.json)

```typescript
@/*           → ./*               // Root level
@/components/* → ./components/*   // Components
@/app/*       → ./app/*           // App pages/actions
@/lib/*       → ./lib/*           // Libraries
@/stores/*    → ./stores/*        // Zustand stores
@/hooks/*     → ./hooks/*         // Custom hooks
@/types/*     → ./types/*         // Type definitions
```

## Key Conventions

### Server Actions Pattern (`app/actions/`)

Every server action file starts with `'use server'` directive:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function myAction(input: InputType): Promise<OutputType> {
  const supabase = await createClient()
  
  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { users: [], total: 0 } // Return safe default on logout race
  
  // Query database (RLS policies automatically enforce access control)
  const { data, error } = await supabase
    .from('table_name')
    .select()
    .eq('user_id', user.id)
  
  if (error) throw error
  return data
}
```

**Important patterns:**
- Always create client with `await createClient()`
- Get authenticated user with `supabase.auth.getUser()`
- When unauthenticated mid-action (logout race), **return empty defaults** instead of throwing
- RLS policies automatically enforce per-row security - no manual checks needed
- Throw errors for actual failures, not for unauthorized access when returning defaults

### Custom Hook Pattern (`useAsyncData`)

For data fetching with caching, deduplication, and retry:

```typescript
const { data, loading, error, refetch } = useAsyncData({
  fetchFn: () => getJobsAdmin(),
  defaultValue: { jobs: [], total: 0 },
  cacheKey: 'admin-jobs',
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  enabled: isLoggedIn, // Don't fetch if not logged in
})
```

**Features:**
- Multi-layer caching (memory + localStorage)
- Automatic request deduplication
- Exponential backoff retry on failure
- Revalidation on mount/focus/reconnect
- Performance metrics tracking

### Optimistic UI Updates

For immediate UI feedback before server confirmation:

```typescript
const { mutate, isPending } = useOptimisticMutation({
  mutationFn: (newData) => updateJobStatus(newData),
  onOptimisticUpdate: (oldData, newData) => ({
    ...oldData,
    status: newData.status,
  }),
})

// UI updates immediately, then server confirms
mutate(newJobData)
```

### Real-Time Subscriptions

Use custom hooks from `hooks/realtime/`:

```typescript
// Watch job feed for new jobs
const { jobs, loading } = useJobFeed({
  latitude: userLocation.lat,
  longitude: userLocation.lng,
  radiusMeters: 50000, // 50km
})

// Watch job status changes
const { job } = useJobUpdates(jobId)

// Watch messages in real-time
const { messages } = useJobMessages(jobId)
```

### Component Pattern (Shadcn-style)

UI components use Radix UI primitives and Tailwind:

```typescript
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

export function MyComponent() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <p>Dialog content</p>
      </DialogContent>
    </Dialog>
  )
}
```

### State Management (Zustand)

For global state (notifications, bookings):

```typescript
// stores/notificationStore.tsx
import { create } from 'zustand'

interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}))
```

### Role-Based Access Control

Three roles determined at signup - enforce in RLS policies and UI:

- **customer** - Can create jobs, book workers, make payments
- **employee** - Can claim jobs, submit work, receive payments
- **admin** - Can view all data, analytics, manage users

Check role in Server Actions:
```typescript
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile.role !== 'admin') {
  return { users: [], total: 0 } // Graceful fallback
}
```

### Environment Variables

Frontend (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Server-side (Next.js secrets):
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Note:** The `NEXT_PUBLIC_*` prefix means these are exposed to the client. Service role key stays server-only.

### TypeScript Practices

```typescript
// Import Database types for autocomplete
import type { Database } from '@/lib/supabase/database.types'

// Type server action parameters explicitly
export async function getJobs(userId: string, limit: number = 10) { ... }

// Use zod for runtime validation in Server Actions
import { z } from 'zod'

const JobSchema = z.object({
  title: z.string().min(3),
  price: z.number().positive(),
})

export async function createJob(formData: z.infer<typeof JobSchema>) {
  const validated = JobSchema.parse(formData) // Runtime validation
  // ...
}
```

## Important Notes

### Logout Race Condition Handling

When users logout from admin pages, pending fetch requests may complete after the session is cleared. To handle this gracefully:

- **Return empty defaults** instead of throwing "Unauthorized" errors
- Example: `getAllUsersAdmin()` returns `{ users: [], total: 0 }` when no user is authenticated
- The UI already guards against this with `enabled: isLoggedIn` checks on hooks
- This provides better UX without exposing data

### @ts-expect-error Usage

Some Supabase operations require type suppression:
```typescript
await supabase.from('jobs').insert({ ... } as any)
```

These are runtime-safe but TypeScript can't infer types for dynamic table operations. This is expected and correct.

### Caching and Validation

The API optimization layer (`lib/api/`) handles:
- **Cache invalidation**: Use `invalidateAsyncDataCache('pattern')` after mutations
- **Revalidation**: Automatic on mount/focus/reconnect based on options
- **Performance**: Cache hit rates and latency metrics logged in dev tools

## Database Details

### Key Tables
- **auth.users** - Supabase Auth users
- **profiles** - User metadata (role, balance, location, ratings)
- **jobs** - Job listings with status and pricing
- **messages** - Real-time chat messages
- **money_transactions** - Transaction history

### Key RPC Functions
- `add_money(user_id, amount)` - Add to user balance
- `claim_job(job_id, employee_id)` - Claim and start job
- `release_escrow(job_id, employee_id, amount, fee)` - Release payment
- `get_nearby_jobs(lat, lng, radius_meters)` - PostGIS proximity search

### RLS Policy Rules

- Users can only access their own data
- Employees see only OPEN nearby jobs
- Customers manage only their jobs
- Admins can access platform-wide data via special policies

## Common Tasks

### Adding a New Server Action

1. Create function in `app/actions/[domain].ts`
2. Start with `'use server'` directive
3. Use `createClient()` for Supabase access
4. Return data or throw on error
5. RLS policies automatically enforce access control

### Adding a New Page

1. Create folder in `app/[role]/[feature]/`
2. Add `page.tsx` with `'use client'` directive for interactivity
3. Use `useAsyncData` hook for data fetching
4. Use optimistic mutations for immediate feedback
5. Subscribe to real-time changes as needed

### Adding a New Component

1. Place in `components/` with descriptive name
2. Use Radix UI primitives for base components
3. Apply Tailwind CSS for styling
4. Export from `components/ui/` if it's a reusable UI element
5. Consider adding to a feature-specific subdirectory if complex

### Performance Optimization

Use the API optimization layer:
```typescript
import { optimizedClient } from '@/lib/api'

const { data } = await optimizedClient.fetch(async (supabase) => {
  return await supabase
    .from('jobs')
    .select()
    .limit(10)
}, {
  cache: true,
  cacheTTL: 5 * 60 * 1000,
  deduplicateKey: 'user-jobs',
  priority: 'high',
})
```
