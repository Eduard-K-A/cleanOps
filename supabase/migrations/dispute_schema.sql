create table public.disputes (
  id uuid not null default extensions.uuid_generate_v4 (),
  job_id uuid null,
  reporter_id uuid null,
  reported_id uuid null,
  reason text not null,
  description text not null,
  evidence_urls text[] null default '{}'::text[],
  status text null default 'OPEN'::text,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint disputes_pkey primary key (id),
  constraint disputes_job_id_fkey foreign KEY (job_id) references jobs (id) on delete CASCADE,
  constraint disputes_reported_id_fkey foreign KEY (reported_id) references profiles (id) on delete CASCADE,
  constraint disputes_reporter_id_fkey foreign KEY (reporter_id) references profiles (id) on delete CASCADE,
  constraint disputes_status_check check (
    (
      status = any (
        array['OPEN'::text, 'RESOLVED'::text, 'DISMISSED'::text]
      )
    )
  )
) TABLESPACE pg_default;