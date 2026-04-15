-- Migration 015: Create proof-of-work storage bucket and policies
-- This bucket stores images uploaded by employees as proof of work completion

-- Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proof-of-work',
  'proof-of-work',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Enable RLS on the bucket
-- Note: bucket-level policies need to be managed via Supabase Dashboard or storage API

-- Policy: Allow authenticated users to upload to their own job folders
CREATE POLICY "Allow workers to upload proof of work"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'proof-of-work' AND
    (
      -- Check if user is the worker for this job
      EXISTS (
        SELECT 1 FROM public.jobs
        WHERE id = (storage.foldername(name))[1]::uuid
        AND worker_id = auth.uid()
      )
    )
  );

-- Policy: Allow anyone to read proof of work images
CREATE POLICY "Allow public read access to proof of work"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'proof-of-work');

-- Policy: Allow workers to delete their own uploads
CREATE POLICY "Allow workers to delete their own proof"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'proof-of-work' AND
    (
      EXISTS (
        SELECT 1 FROM public.jobs
        WHERE id = (storage.foldername(name))[1]::uuid
        AND worker_id = auth.uid()
      )
    )
  );
