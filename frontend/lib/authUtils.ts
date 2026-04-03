import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from './supabase/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Updates user's JWT metadata to match their database role
 * This ensures JWT metadata is always reliable for authentication
 */
export async function syncJwtMetadata(user: User): Promise<void> {
  try {
    // Get current role from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.warn('[authUtils] Could not fetch profile for JWT sync:', error);
      return;
    }

    // Get current JWT metadata
    const currentMetadata = user.user_metadata || {};
    
    // Only update if role has changed
    if (currentMetadata.role !== (profile as Profile).role) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...currentMetadata,
          role: (profile as Profile).role,
        },
      });

      if (updateError) {
        console.error('[authUtils] Failed to update JWT metadata:', updateError);
      } else {
        console.log('[authUtils] JWT metadata synced to role:', (profile as Profile).role);
      }
    }
  } catch (error) {
    console.error('[authUtils] JWT sync error:', error);
  }
}

/**
 * Ensures JWT metadata is reliable after role changes
 * Call this after any role update operations
 */
export async function ensureJwtConsistency(userId: string): Promise<void> {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user && session.user.id === userId) {
      await syncJwtMetadata(session.user);
    }
  } catch (error) {
    console.error('[authUtils] JWT consistency check failed:', error);
  }
}
