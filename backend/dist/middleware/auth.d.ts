import { Request, Response, NextFunction } from 'express';
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
export declare function verifyAuth(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction): Promise<void>;
/**
 * Middleware to require specific role
 */
export declare function requireRole(role: 'customer' | 'employee'): (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map