-- Migration 005: Ensure location_lat and location_lng columns exist on jobs
-- (Already included in migration 001, but this ensures idempotency for older databases)

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

-- Ensure the geography sync trigger exists
DROP TRIGGER IF EXISTS trg_sync_job_location ON public.jobs;

CREATE TRIGGER trg_sync_job_location
  BEFORE INSERT OR UPDATE OF location_lat, location_lng
  ON public.jobs
  FOR EACH ROW
  EXECUTE PROCEDURE sync_job_location_geography();
