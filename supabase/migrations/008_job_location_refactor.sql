-- Migration 008: Refactor jobs location by adding distance and dropping precise coordinates

-- Step 1: Add new distance column (representing Est. Distance from City Hall in KM)
ALTER TABLE jobs 
  ADD COLUMN distance NUMERIC(10, 2);

-- Step 2: Drop the trigger that auto-calculates location_coordinates from lat/lng
DROP TRIGGER IF EXISTS update_job_location_coordinates ON jobs;
DROP FUNCTION IF EXISTS update_job_location_coordinates();

-- Step 3: Drop the deprecated coordinate columns
ALTER TABLE jobs
  DROP COLUMN IF EXISTS location_lat,
  DROP COLUMN IF EXISTS location_lng,
  DROP COLUMN IF EXISTS location_coordinates;
