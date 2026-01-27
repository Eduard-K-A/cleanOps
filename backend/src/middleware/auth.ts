import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

/**
 * Middleware to verify Supabase JWT token
 */
export async function verifyAuth(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
        code: 401,
      });
      return;
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseAdmin();

    // Verify the JWT token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 401,
      });
      return;
    }

    // Get user profile to include role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Attach user info to request; role is optional if profile doesn't exist yet
    req.user = {
      id: user.id,
      email: user.email,
      role: (profile as any)?.role,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 500,
    });
  }
}

/**
 * Middleware to require specific role
 */
export function requireRole(role: 'customer' | 'employee') {
  return (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 401,
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        error: `Access denied. ${role} role required.`,
        code: 403,
      });
      return;
    }

    next();
  };
}
