-- Change jobs.price_amount from INTEGER (cents) to NUMERIC (dollars)
ALTER TABLE public.jobs 
ALTER COLUMN price_amount TYPE NUMERIC(12,2) USING price_amount::NUMERIC(12,2);

-- Note: If you already had data in cents (e.g., 15000), 
-- you may want to run: UPDATE public.jobs SET price_amount = price_amount / 100;
