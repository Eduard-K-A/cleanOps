-- Migration: Refactor platform_config to a singleton table by altering the existing table


-- 2. Clear existing rows so we can safely add a single-value primary key without conflict
DELETE FROM public.platform_config;

-- 3. Alter the table structure
ALTER TABLE public.platform_config DROP CONSTRAINT IF EXISTS platform_config_pkey CASCADE;
ALTER TABLE public.platform_config DROP COLUMN IF EXISTS key;
ALTER TABLE public.platform_config DROP COLUMN IF EXISTS value;
ALTER TABLE public.platform_config DROP COLUMN IF EXISTS description;

-- 4. Add new columns
ALTER TABLE public.platform_config ADD COLUMN IF NOT EXISTS id INT PRIMARY KEY CHECK (id = 1);
ALTER TABLE public.platform_config ADD COLUMN IF NOT EXISTS platform_fee_pct NUMERIC NOT NULL DEFAULT 15;
ALTER TABLE public.platform_config ADD COLUMN IF NOT EXISTS max_active_jobs INTEGER NOT NULL DEFAULT 4;
ALTER TABLE public.platform_config ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT false;

-- 5. Consolidate and insert the single row
DO $$
DECLARE
  v_fee NUMERIC := 15;
  v_jobs INTEGER := 4;
  v_maint BOOLEAN := false;
  v_updated_at TIMESTAMPTZ := NOW();
  v_updated_by UUID := NULL;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'temp_config' AND column_name = 'key'
  ) THEN
    v_fee := COALESCE((SELECT value::NUMERIC FROM temp_config WHERE key = 'platform_fee_pct'), 15);
    v_jobs := COALESCE((SELECT value::INTEGER FROM temp_config WHERE key = 'max_active_jobs'), 4);
    v_maint := COALESCE((SELECT value::BOOLEAN FROM temp_config WHERE key = 'maintenance_mode'), false);
    
    SELECT updated_at, updated_by INTO v_updated_at, v_updated_by 
    FROM temp_config 
    ORDER BY updated_at DESC 
    LIMIT 1;
  END IF;

  INSERT INTO public.platform_config (id, platform_fee_pct, max_active_jobs, maintenance_mode, updated_at, updated_by)
  VALUES (1, v_fee, v_jobs, v_maint, COALESCE(v_updated_at, NOW()), v_updated_by)
  ON CONFLICT (id) DO UPDATE SET
    platform_fee_pct = EXCLUDED.platform_fee_pct,
    max_active_jobs = EXCLUDED.max_active_jobs,
    maintenance_mode = EXCLUDED.maintenance_mode,
    updated_at = EXCLUDED.updated_at,
    updated_by = EXCLUDED.updated_by;
END $$;

-- 6. Cleanup
DROP TABLE IF EXISTS temp_config;

-- 7. Update depending functions
CREATE OR REPLACE FUNCTION check_active_jobs_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Fetch max_active_jobs from singleton platform_config
  SELECT COALESCE(max_active_jobs, 4) INTO max_limit 
  FROM public.platform_config 
  WHERE id = 1;

  IF NEW.status NOT IN ('OPEN', 'IN_PROGRESS') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::INTEGER INTO active_count
  FROM public.jobs
  WHERE customer_id = NEW.customer_id
    AND status IN ('OPEN', 'IN_PROGRESS')
    AND id IS DISTINCT FROM NEW.id;

  IF active_count >= max_limit THEN
    RAISE EXCEPTION 'Customer cannot have more than % active jobs (OPEN or IN_PROGRESS)', max_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
