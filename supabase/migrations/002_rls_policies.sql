-- CleanOps — Row Level Security (RLS) Policies
-- Enable RLS and define policies for all public tables.

-- =============================================================================
-- PROFILES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- JOBS
-- =============================================================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select"
  ON public.jobs FOR SELECT
  USING (
    auth.uid() = customer_id
    OR auth.uid() = worker_id
    OR status = 'OPEN'
  );

CREATE POLICY "jobs_insert_customer"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "jobs_update"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = customer_id OR auth.uid() = worker_id)
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = worker_id);

-- =============================================================================
-- MESSAGES
-- =============================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = messages.job_id
        AND (j.customer_id = auth.uid() OR j.worker_id = auth.uid())
    )
  );

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

CREATE POLICY "notifications_insert_own"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
