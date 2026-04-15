-- Migration 013: Add phone_number column to profiles table
-- This allows users to store their contact phone number for job coordination

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone_number IS 'User contact phone number for job coordination and notifications';

-- Add index for potential phone lookups (optional, can be enabled if needed)
-- CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
