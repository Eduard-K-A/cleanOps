import { Router, Response } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../config/supabase';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, Profile } from '../types';

const router = Router();
// Supabase table typing may resolve to `never` without a generated Database type.
// Cast here to keep route handlers compiling cleanly.
const supabase = getSupabaseAdmin() as any;

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'employee']).optional().default('customer'),
});

/**
 * POST /api/auth/signup
 * Create a user via the service role to bypass email rate limits.
 */
router.post('/signup', async (req, res: Response<ApiResponse<{ user_id: string; role: string }>>) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors[0]?.message ?? 'Invalid payload',
        code: 400,
      });
      return;
    }

    const { email, password, role } = parsed.data;

    // Create the user and auto-confirm to avoid email send rate limits
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created?.user) {
      console.error('auth/signup create error:', createError);
      res.status(500).json({
        success: false,
        // Surface a friendly error for already-registered emails; fall back otherwise
        error:
          createError?.message === 'User already registered'
            ? 'Email already registered'
            : createError?.message ?? 'Failed to create user',
        code: 500,
      });
      return;
    }

    // Ensure a profile row exists
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: created.user.id, role })
      .select('id')
      .single();

    if (profileError) {
      console.error('auth/signup profile error:', profileError);
      res.status(500).json({
        success: false,
        error: 'User created but failed to create profile',
        code: 500,
      });
      return;
    }

    res.json({
      success: true,
      data: { user_id: created.user.id, role },
    });
  } catch (error) {
    console.error('auth/signup unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Signup failed',
      code: 500,
    });
  }
});

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

