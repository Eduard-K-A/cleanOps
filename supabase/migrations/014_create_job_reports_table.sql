-- Migration 014: Create job_reports table for dispute reporting
-- This table stores customer reports about job issues

-- Create enum type for report status
CREATE TYPE report_status AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- Create job_reports table
CREATE TABLE public.job_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status report_status NOT NULL DEFAULT 'PENDING',
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_job_reports_job_id ON public.job_reports(job_id);
CREATE INDEX idx_job_reports_reporter_id ON public.job_reports(reporter_id);
CREATE INDEX idx_job_reports_status ON public.job_reports(status);
CREATE INDEX idx_job_reports_created_at ON public.job_reports(created_at DESC);

-- Create trigger to auto-update updated_at
CREATE TRIGGER trg_job_reports_updated_at
  BEFORE UPDATE ON public.job_reports
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Enable RLS
ALTER TABLE public.job_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Customers can view their own reports
CREATE POLICY "Customers can view own reports"
  ON public.job_reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Customers can create reports for jobs they created
CREATE POLICY "Customers can create reports for own jobs"
  ON public.job_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE id = job_id 
      AND customer_id = auth.uid()
      AND status IN ('IN_PROGRESS', 'PENDING_REVIEW')
    )
  );

-- Only admins can update report status
CREATE POLICY "Only admins can update reports"
  ON public.job_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON public.job_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.job_reports IS 'Stores customer dispute reports about jobs';
