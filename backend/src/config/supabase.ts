import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env';

let supabaseAdmin: ReturnType<typeof createClient>;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const env = getEnv();
    supabaseAdmin = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdmin;
}

// Client for user-authenticated requests (uses anon key)
export function getSupabaseClient(authToken?: string) {
  const env = getEnv();
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    },
  });
  return client;
}
