-- Add 'admin' as a valid role to the profiles table CHECK constraint
-- Run against Supabase SQL editor

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Re-add with 'admin' included
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'employee', 'admin'));

-- Step 3: Create index for admin role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role_admin
  ON public.profiles(role) WHERE role = 'admin';

-- Step 4: Promote a user to admin (replace with real UUID)
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'your-user-uuid-here';

-- Step 5: Update RLS policy — admins can read all profiles
CREATE POLICY "admin_read_all_profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Step 6: Admin can read all jobs
CREATE POLICY "admin_read_all_jobs"
  ON public.jobs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Step 7: Admin can update any job
CREATE POLICY "admin_update_any_job"
  ON public.jobs FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );