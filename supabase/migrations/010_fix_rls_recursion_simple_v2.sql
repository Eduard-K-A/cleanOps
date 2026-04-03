-- Simple fix for infinite recursion in RLS policies
-- Uses SECURITY DEFINER function to bypass RLS for admin checks

-- Step 1: Drop problematic policies
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_read_all_jobs" ON public.jobs;
DROP POLICY IF EXISTS "admin_update_any_job" ON public.jobs;
DROP POLICY IF EXISTS "admin_only_platform_config" ON public.platform_config;

-- Step 2: Create SECURITY DEFINER function to check admin role
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Step 3: Recreate policies using the SECURITY DEFINER function
CREATE POLICY "admin_read_all_profiles"
  ON public.profiles FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_read_all_jobs"
  ON public.jobs FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_update_any_job"
  ON public.jobs FOR UPDATE
  USING (is_admin_user(auth.uid()));

-- Step 4: Create platform_config policy only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'platform_config') THEN
    CREATE POLICY "admin_only_platform_config"
      ON public.platform_config FOR ALL
      USING (is_admin_user(auth.uid()));
  END IF;
END $$;

-- Step 5: Ensure regular user policies still work
CREATE POLICY "users_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "customers_own_jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "employees_own_jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = worker_id);

CREATE POLICY "workers_can_claim_jobs"
  ON public.jobs FOR UPDATE
  USING (
    auth.uid() = worker_id AND 
    status = 'OPEN'
  );

CREATE POLICY "customers_can_create_jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = customer_id);
