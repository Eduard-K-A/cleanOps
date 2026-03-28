-- Migration 007: Ensure full_name and onboarding_completed columns exist on profiles
-- (Already included in migration 001, but this ensures idempotency for older databases)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure onboarding_completed is set to FALSE for existing rows
UPDATE public.profiles 
SET onboarding_completed = FALSE 
WHERE onboarding_completed IS NULL;
