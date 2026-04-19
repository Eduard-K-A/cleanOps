-- Job Applications Table
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(job_id, employee_id)
);

-- RLS Policies
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Employees can see their own applications
CREATE POLICY "applications_select_employee"
    ON public.job_applications FOR SELECT
    USING (auth.uid() = employee_id);

-- Customers can see applications for their jobs
CREATE POLICY "applications_select_customer"
    ON public.job_applications FOR SELECT
    USING (
        auth.uid() IN (
            SELECT customer_id FROM public.jobs WHERE id = job_applications.job_id
        )
    );

-- Employees can apply (insert)
CREATE POLICY "applications_insert_employee"
    ON public.job_applications FOR INSERT
    WITH CHECK (
        auth.uid() = employee_id AND
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'employee'
        )
    );

-- Customers can update application status
CREATE POLICY "applications_update_customer"
    ON public.job_applications FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT customer_id FROM public.jobs WHERE id = job_applications.job_id
        )
    );

-- Trigger for updated_at
CREATE TRIGGER trg_job_applications_updated_at
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Indexes for performance
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_employee_id ON public.job_applications(employee_id);
