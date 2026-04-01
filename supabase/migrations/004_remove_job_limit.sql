-- Remove the 2 active jobs limit for customers

-- Drop the trigger first
DROP TRIGGER IF EXISTS trg_jobs_active_limit ON public.jobs;

-- Drop the function
DROP FUNCTION IF EXISTS check_active_jobs_limit();

-- Note: This removes the limitation on the number of active jobs a customer can have
-- Customers can now create unlimited jobs with OPEN or IN_PROGRESS status
