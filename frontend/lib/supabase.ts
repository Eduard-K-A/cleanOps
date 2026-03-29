// Re-export the browser client for backward compatibility
export { createClient } from './supabase/client';

// For direct imports, use the browser client
import { createClient as createBrowserClient } from './supabase/client';

export const supabase = createBrowserClient();
