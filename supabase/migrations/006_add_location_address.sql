-- Migration 006: Ensure location_address column exists on jobs
-- (Already included in migration 001, but this ensures idempotency for older databases)

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS location_address TEXT;
