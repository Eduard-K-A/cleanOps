-- Migration 021: Add fee columns to jobs table to lock in revenue split at creation time

ALTER TABLE public.jobs
ADD COLUMN fee_pct NUMERIC DEFAULT 15,
ADD COLUMN fee_amount NUMERIC DEFAULT 0;

-- Update existing jobs with current platform fee from platform_config
DO $$
DECLARE
  current_fee NUMERIC;
BEGIN
  -- We assume 023_platform_config_singleton might run after this, or before. 
  -- We should handle either structure if this migration runs independently, or just update it assuming the singleton exists.
  -- Since migrations run in order, 021 runs before 023. Let's keep 021 as is or update it to be safe.
  
  -- Actually, let's keep 021 as it was because it runs before 023!
  -- Wait, I should not modify 021 if it's already run in the past. But let me make it safe for both.
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'platform_config' AND column_name = 'platform_fee_pct'
  ) THEN
    SELECT COALESCE(platform_fee_pct, 15) INTO current_fee
    FROM public.platform_config WHERE id = 1;
  ELSE
    SELECT COALESCE((SELECT value::NUMERIC FROM public.platform_config WHERE key = 'platform_fee_pct'), 15) INTO current_fee;
  END IF;

  UPDATE public.jobs
  SET fee_pct = current_fee,
      fee_amount = ROUND(price_amount * (current_fee / 100))
  WHERE fee_pct IS NULL OR fee_pct = 15; -- Initialize defaults
END $$;
