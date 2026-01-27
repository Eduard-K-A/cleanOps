-- CleanOps — Row Level Security (RLS)
-- Enable RLS and define policies for all public tables.

-- =============================================================================
-- PROFILES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile.
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (e.g. on signup).
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile.
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- JOBS
-- =============================================================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Customers can read their own jobs; workers can read jobs they're assigned to.
CREATE POLICY "jobs_select_customer_or_worker"
  ON public.jobs FOR SELECT
  USING (
    auth.uid() = customer_id
    OR auth.uid() = worker_id
  );

-- Employees can list OPEN jobs for the feed (proximity sort done in app/service).
CREATE POLICY "jobs_select_open_for_employees"
  ON public.jobs FOR SELECT
  USING (status = 'OPEN');

-- Policy above allows any authenticated user to SELECT OPEN jobs. Combined with
-- "customer_or_worker" we need OR. So: (customer_id = uid OR worker_id = uid OR status = 'OPEN').
-- Drop the first two and use one policy:
DROP POLICY IF EXISTS "jobs_select_customer_or_worker" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_open_for_employees" ON public.jobs;

CREATE POLICY "jobs_select"
  ON public.jobs FOR SELECT
  USING (
    auth.uid() = customer_id
    OR auth.uid() = worker_id
    OR status = 'OPEN'
  );

-- Only customers create jobs (via API; backend uses service role or validated uid).
CREATE POLICY "jobs_insert_customer"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own jobs; workers can update jobs they're assigned to.
CREATE POLICY "jobs_update"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = worker_id)
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = worker_id);

-- Only customer can delete (cancel) their job; optional. We use status CANCELLED typically.
-- No DELETE policy: use soft cancel via UPDATE.

-- =============================================================================
-- MESSAGES
-- =============================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only job participants can read messages. We need to check jobs table.
CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = messages.job_id
        AND (j.customer_id = auth.uid() OR j.worker_id = auth.uid())
    )
  );

-- Only job participants can send messages.
CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = messages.job_id
        AND (j.customer_id = auth.uid() OR j.worker_id = auth.uid())
    )
  );

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inserts typically come from backend (cron, etc.) via service role. Allow user
-- inserts if needed (e.g. system creating notif for user).
CREATE POLICY "notifications_insert_own"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS for cron/webhook-driven notification inserts.
