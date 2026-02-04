-- Add full_name and onboarding_completed to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing rows to ensure default
UPDATE public.profiles SET onboarding_completed = FALSE WHERE onboarding_completed IS NULL;
