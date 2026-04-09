-- Add read tracking to messages table
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for unread counts per user
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages(job_id, is_read)
  WHERE is_read = FALSE;

-- RLS Policy: allow participants to update is_read status
CREATE POLICY "messages_update_read"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = messages.job_id
        AND (j.customer_id = auth.uid() OR j.worker_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = messages.job_id
        AND (j.customer_id = auth.uid() OR j.worker_id = auth.uid())
    )
  );

-- Enable realtime replication for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
