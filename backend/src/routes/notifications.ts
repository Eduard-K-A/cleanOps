import { Router } from 'express';
import { Response } from 'express';
import { verifyAuth } from '../middleware/auth';
import { getSupabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse, Notification } from '../types';

const router = Router();
// Supabase table typing may resolve to `never` without a generated Database type.
// Cast here to keep route handlers compiling cleanly.
const supabase = getSupabaseAdmin() as any;

router.use(verifyAuth);

/**
 * Get user notifications
 */
router.get('/', async (req: AuthenticatedRequest, res: Response<ApiResponse<Notification[]>>) => {
  try {
    const userId = req.user!.id;
    const { is_read, limit = '50' } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string, 10));

    if (is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true');
    }

    const { data: notifications, error } = await query;

    if (error) {
      throw new AppError('Failed to fetch notifications', 500);
    }

    res.json({
      success: true,
      data: notifications as Notification[],
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch notifications', 500);
  }
});

/**
 * Mark notification as read
 */
router.patch(
  '/:id/read',
  async (req: AuthenticatedRequest, res: Response<ApiResponse<Notification>>) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const { data: notification, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !notification) {
        throw new AppError('Notification not found', 404);
      }

      res.json({
        success: true,
        data: notification as Notification,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update notification', 500);
    }
  }
);

/**
 * Mark all notifications as read
 */
router.post('/read-all', async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.id;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new AppError('Failed to update notifications', 500);
    }

    res.json({
      success: true,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update notifications', 500);
  }
});

export default router;
