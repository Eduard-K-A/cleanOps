import { Router, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, Profile } from '../types';

const router = Router();
// Supabase table typing may resolve to `never` without a generated Database type.
// Cast here to keep route handlers compiling cleanly.
const supabase = getSupabaseAdmin() as any;

/**
 * GET /api/auth/me
 * Return current user profile (creates a default profile if missing).
 */
router.get(
  '/me',
  verifyAuth,
  async (req: AuthenticatedRequest, res: Response<ApiResponse<Profile>>) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 401,
        });
        return;
      }

      const userId = req.user.id;

      // Try to load existing profile
      const {
        data: existing,
        error: existingError,
      } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // If we got an error that isn't "no rows", stop here.
      if (existingError && existingError.code !== 'PGRST116') {
        console.error('auth/me load profile error:', existingError);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch profile',
          code: 500,
        });
        return;
      }

      let profileRow = (existing as any) ?? null;

      // If profile does not exist, create a default one (customer role)
      if (!profileRow) {
        const {
          data: created,
          error: insertError,
        } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            role: 'customer',
          })
          .select('*')
          .single();

        if (insertError || !created) {
          console.error('auth/me create profile error:', insertError);
          res.status(500).json({
            success: false,
            error: 'Failed to ensure profile',
            code: 500,
          });
          return;
        }

        profileRow = created as any;
      }

      const profile: Profile = {
        id: profileRow.id,
        role: profileRow.role,
        stripe_account_id: profileRow.stripe_account_id ?? null,
        rating: Number(profileRow.rating ?? 5),
        location_lat: profileRow.location_lat ?? null,
        location_lng: profileRow.location_lng ?? null,
        created_at: profileRow.created_at,
        updated_at: profileRow.updated_at,
      };

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error('auth/me unexpected error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile',
        code: 500,
      });
    }
  }
);

export default router;

