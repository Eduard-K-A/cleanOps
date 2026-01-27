-- CleanOps — Initial schema
-- Run against Supabase (PostgreSQL). Requires PostGIS extension.

CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- PROFILES (extends auth.users)
-- =============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'employee')) DEFAULT 'customer',
  stripe_account_id TEXT,
  rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 5),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_stripe_account ON public.profiles(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- =============================================================================
-- JOBS
-- =============================================================================
CREATE TYPE job_status AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'PENDING_REVIEW',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE job_urgency AS ENUM ('LOW', 'NORMAL', 'HIGH');

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status job_status NOT NULL DEFAULT 'OPEN',
  urgency job_urgency NOT NULL DEFAULT 'NORMAL',
  price_amount INTEGER NOT NULL CHECK (price_amount > 0), -- cents
  stripe_payment_intent_id TEXT,
  location_coordinates GEOGRAPHY(POINT, 4326),
  tasks JSONB NOT NULL DEFAULT '[]',
  proof_of_work JSONB NOT NULL DEFAULT '[]', -- array of URLs
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_customer ON public.jobs(customer_id);
CREATE INDEX idx_jobs_worker ON public.jobs(worker_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_urgency ON public.jobs(urgency);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_jobs_location ON public.jobs USING GIST(location_coordinates);

-- =============================================================================
-- MESSAGES
-- =============================================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_job ON public.messages(job_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = FALSE;

-- =============================================================================
-- TRIGGER: max 2 active jobs per customer (OPEN or IN_PROGRESS)
-- =============================================================================
CREATE OR REPLACE FUNCTION check_active_jobs_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  IF NEW.status NOT IN ('OPEN', 'IN_PROGRESS') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::INTEGER INTO active_count
  FROM public.jobs
  WHERE customer_id = NEW.customer_id
    AND status IN ('OPEN', 'IN_PROGRESS')
    AND id IS DISTINCT FROM NEW.id;

  IF active_count >= 2 THEN
    RAISE EXCEPTION 'Customer cannot have more than 2 active jobs (OPEN or IN_PROGRESS)'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jobs_active_limit
  BEFORE INSERT OR UPDATE OF status, customer_id
  ON public.jobs
  FOR EACH ROW
  EXECUTE PROCEDURE check_active_jobs_limit();

-- =============================================================================
-- UPDATED_AT trigger for profiles and jobs
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
