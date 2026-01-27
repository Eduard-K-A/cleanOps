-- Add location_lat, location_lng to jobs and keep location_coordinates in sync via trigger.
-- API inserts lat/lng; geography is used for proximity queries.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

CREATE OR REPLACE FUNCTION sync_job_location_geography()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL THEN
    NEW.location_coordinates := ST_SetSRID(ST_MakePoint(NEW.location_lng, NEW.location_lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_job_location ON public.jobs;
CREATE TRIGGER trg_sync_job_location
  BEFORE INSERT OR UPDATE OF location_lat, location_lng
  ON public.jobs
  FOR EACH ROW
  EXECUTE PROCEDURE sync_job_location_geography();
