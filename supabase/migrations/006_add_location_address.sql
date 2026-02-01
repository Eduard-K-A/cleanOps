-- Add location_address column to jobs to store plain-text addresses
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS location_address TEXT;
