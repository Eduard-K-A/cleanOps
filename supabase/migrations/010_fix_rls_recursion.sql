-- Fix infinite recursion in RLS policies by using auth.jwt() instead of querying profiles table
-- This migration fixes the 42P17 error

-- Step 1: Drop the problematic policies (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'admin_read_all_profiles') THEN
    DROP POLICY "admin_read_all_profiles" ON public.profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'admin_read_all_jobs') THEN
    DROP POLICY "admin_read_all_jobs" ON public.jobs;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'admin_update_any_job') THEN
    DROP POLICY "admin_update_any_job" ON public.jobs;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'platform_config') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_config' AND policyname = 'admin_only_platform_config') THEN
      DROP POLICY "admin_only_platform_config" ON public.platform_config;
    END IF;
  END IF;
END $$;

-- Step 2: Create a helper function to check admin role from JWT
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'user_role') = 'admin',
    false
  );
$$;

-- Step 3: Recreate policies using the helper function
-- Profiles policies
CREATE POLICY "admin_read_all_profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "users_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_own_profile_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "users_own_profile_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Jobs policies
CREATE POLICY "admin_read_all_jobs"
  ON public.jobs FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_update_any_job"
  ON public.jobs FOR UPDATE
  USING (is_admin());

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

-- Platform config policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'platform_config') THEN
    CREATE POLICY "admin_only_platform_config"
      ON public.platform_config FOR ALL
      USING (is_admin());
  END IF;
END $$;

-- Step 4: Update auth trigger to set user_role in JWT metadata
CREATE OR REPLACE FUNCTION public.set_user_role_in_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the user_role in JWT metadata when profile is created/updated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM set_config(
      'request.jwt.claims',
      jsonb_set(
        COALESCE(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb),
        '{user_role}',
        to_jsonb(NEW.role)
      )::text,
      true
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Step 5: Create trigger to update JWT claims when profile changes
DROP TRIGGER IF EXISTS set_user_role_jwt_trigger ON public.profiles;
CREATE TRIGGER set_user_role_jwt_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_user_role_in_jwt();
