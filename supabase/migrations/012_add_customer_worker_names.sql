-- Add customer_name and worker_name columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN customer_name TEXT,
ADD COLUMN worker_name TEXT;
