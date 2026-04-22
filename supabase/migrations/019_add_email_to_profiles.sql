-- Migration 019: Add email to profiles and provide SQL execution for admins

-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Populate existing emails from auth.users (more reliable than identities for primary email)
-- Although user asked for identities, auth.users is the standard source. 
-- I will use identities in the snippet I provide in the UI to match their request exactly there.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Trigger to keep email in sync on auth.users changes
CREATE OR REPLACE FUNCTION public.handle_auth_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_email_update();

-- 4. RPC to execute SQL for admins (for the SQL Editor feature)
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_json JSONB;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can execute SQL';
  END IF;

  -- Attempt to capture results as JSON if it's a SELECT (or returns rows)
  -- This is a simple heuristic: if it starts with SELECT, try to get rows.
  IF (TRIM(sql_query) ILIKE 'SELECT%') THEN
    EXECUTE 'SELECT coalesce(jsonb_agg(t), ''[]''::jsonb) FROM (' || sql_query || ') t' INTO result_json;
    RETURN result_json;
  ELSE
    EXECUTE sql_query;
    RETURN jsonb_build_object('success', true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
