// Re-export the browser client for backward compatibility
export { createClient } from './supabase/client';

// For direct imports, use the browser client
import { createClient as createBrowserClient } from './supabase/client';

const globalForSupabase = globalThis as unknown as { supabase: ReturnType<typeof createBrowserClient> | undefined };

export const supabase = globalForSupabase.supabase ?? createBrowserClient();
if (process.env.NODE_ENV !== 'production') globalForSupabase.supabase = supabase;
