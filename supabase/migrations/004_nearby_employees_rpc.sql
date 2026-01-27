-- RPC: employees within radius_km of (lat, lng) with rating > min_rating.
CREATE OR REPLACE FUNCTION public.nearby_employees(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 10,
  min_rating NUMERIC DEFAULT 4.5
)
RETURNS TABLE (id UUID)
LANGUAGE sql
STABLE
AS $$
  SELECT p.id
  FROM public.profiles p
  WHERE p.role = 'employee'
    AND p.location_lat IS NOT NULL
    AND p.location_lng IS NOT NULL
    AND (p.rating IS NULL OR p.rating >= min_rating)
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(p.location_lng, p.location_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    );
$$;
