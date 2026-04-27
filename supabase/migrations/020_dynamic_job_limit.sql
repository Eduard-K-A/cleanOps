-- Update check_active_jobs_limit to use dynamic limit from platform_config
-- Also sets the default value in platform_config to 4

UPDATE public.platform_config SET value = '4' WHERE key = 'max_active_jobs';

CREATE OR REPLACE FUNCTION check_active_jobs_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Fetch max_active_jobs from platform_config, default to 4 if not set
  SELECT COALESCE(value::INTEGER, 4) INTO max_limit 
  FROM public.platform_config 
  WHERE key = 'max_active_jobs';

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
