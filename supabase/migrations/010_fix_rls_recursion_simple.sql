-- Simple fix for infinite recursion in RLS policies
-- Replace the problematic policies with ones that bypass RLS for admin checks

-- Step 1: Drop the problematic policies
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_read_all_jobs" ON public.jobs;
DROP POLICY IF EXISTS "admin_update_any_job" ON public.jobs;

-- Step 2: Create admin policies using auth.jwt() to avoid recursion
CREATE POLICY "admin_read_all_profiles"
  ON public.profiles FOR SELECT
  USING (
    -- Check if user_role in JWT is admin
    COALESCE((current_setting('request.jwt.claims', true)::json->>'user_role'), '') = 'admin'
  );

CREATE POLICY "admin_read_all_jobs"
  ON public.jobs FOR SELECT
  USING (
    -- Check if user_role in JWT is admin
    COALESCE((current_setting('request.jwt.claims', true)::json->>'user_role'), '') = 'admin'
  );

CREATE POLICY "admin_update_any_job"
  ON public.jobs FOR UPDATE
  USING (
    -- Check if user_role in JWT is admin
    COALESCE((current_setting('request.jwt.claims', true)::json->>'user_role'), '') = 'admin'
  );

-- Step 3: Ensure regular user policies still work
CREATE POLICY "users_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "customers_own_jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "employees_own_jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = worker_id);
