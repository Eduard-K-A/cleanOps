-- RPC: nearby OPEN jobs within radius_km, sorted by distance.
CREATE OR REPLACE FUNCTION public.nearby_open_jobs(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 50
)
RETURNS SETOF public.jobs
LANGUAGE sql
STABLE
AS $$
  SELECT j.*
  FROM public.jobs j
  WHERE j.status = 'OPEN'
    AND j.location_coordinates IS NOT NULL
    AND ST_DWithin(
      j.location_coordinates::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY ST_Distance(
    j.location_coordinates::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  );
$$;
