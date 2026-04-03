-- Final fix for infinite recursion in RLS policies
-- Uses SECURITY DEFINER function to bypass RLS for admin checks

-- Step 1: Drop ALL existing policies that might cause issues
DO $$
BEGIN
  -- Drop all policies on profiles table
  DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
  DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
  DROP POLICY IF EXISTS "users_own_profile_update" ON public.profiles;
  DROP POLICY IF EXISTS "users_own_profile_insert" ON public.profiles;
  
  -- Drop all policies on jobs table
  DROP POLICY IF EXISTS "admin_read_all_jobs" ON public.jobs;
  DROP POLICY IF EXISTS "admin_update_any_job" ON public.jobs;
  DROP POLICY IF EXISTS "customers_own_jobs" ON public.jobs;
  DROP POLICY IF EXISTS "employees_own_jobs" ON public.jobs;
  DROP POLICY IF EXISTS "workers_can_claim_jobs" ON public.jobs;
  DROP POLICY IF EXISTS "customers_can_create_jobs" ON public.jobs;
  
  -- Drop platform_config policy if table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'platform_config') THEN
    DROP POLICY IF EXISTS "admin_only_platform_config" ON public.platform_config;
  END IF;
END $$;

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

-- Step 3: Create new policies for profiles table
CREATE POLICY "admin_read_all_profiles"
  ON public.profiles FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "users_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_own_profile_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "users_own_profile_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 4: Create new policies for jobs table
CREATE POLICY "admin_read_all_jobs"
  ON public.jobs FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "admin_update_any_job"
  ON public.jobs FOR UPDATE
  USING (is_admin_user(auth.uid()));

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

-- Step 5: Create platform_config policy only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'platform_config') THEN
    CREATE POLICY "admin_only_platform_config"
      ON public.platform_config FOR ALL
      USING (is_admin_user(auth.uid()));
  END IF;
END $$;

-- Step 6: Verify RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'platform_config') THEN
    ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
