-- Platform configuration table for admin settings page

CREATE TABLE public.platform_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Seed default values
INSERT INTO public.platform_config (key, value, description) VALUES
  ('platform_fee_pct', '15',    'Platform fee percentage (applied on job completion)'),
  ('max_active_jobs',  '2',     'Max concurrent OPEN/IN_PROGRESS jobs per customer'),
  ('maintenance_mode', 'false', 'When true, disables new job creation for customers');

-- RLS: Only admins can read/write platform_config
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_platform_config"
  ON public.platform_config FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Trigger to update updated_at on change
CREATE TRIGGER trg_platform_config_updated_at
  BEFORE UPDATE ON public.platform_config
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();