import { Router, type NextFunction, type Response } from 'express';
import { z } from 'zod';
import { verifyAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getSupabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse, Message } from '../types';

const router = Router();
// Supabase table typing may resolve to `never` without a generated Database type.
// Cast here to keep route handlers compiling cleanly.
const supabase = getSupabaseAdmin() as any;

router.use(verifyAuth);

/**
 * Get messages for a job
 */
router.get(
  '/job/:job_id',
  validate({
    params: z.object({
      job_id: z.string().uuid(),
    }),
  }),
  async (req: AuthenticatedRequest, res: Response<ApiResponse<Message[]>>, next: NextFunction) => {
    try {
      const { job_id } = req.params;
      const userId = req.user!.id;

      // Verify user has access to this job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('customer_id, worker_id')
        .eq('id', job_id)
        .single();

      if (jobError || !job) {
        throw new AppError('Job not found', 404);
      }

      if (job.customer_id !== userId && job.worker_id !== userId) {
        throw new AppError('Unauthorized', 403);
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', job_id)
        .order('created_at', { ascending: true });

      if (error) {
        throw new AppError('Failed to fetch messages', 500);
      }

      res.json({
        success: true,
        data: messages as Message[],
      });
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to fetch messages', 500));
    }
  }
);

/**
 * Send a message
 */
router.post(
  '/',
  validate({
    body: z.object({
      job_id: z.string().uuid(),
      content: z.string().min(1).max(1000),
    }),
  }),
  async (req: AuthenticatedRequest, res: Response<ApiResponse<Message>>, next: NextFunction) => {
    try {
      const { job_id, content } = req.body as { job_id: string; content: string };
      const userId = req.user!.id;

      // Verify user has access to this job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('customer_id, worker_id')
        .eq('id', job_id)
        .single();

      if (jobError || !job) {
        throw new AppError('Job not found', 404);
      }

      if (job.customer_id !== userId && job.worker_id !== userId) {
        throw new AppError('Unauthorized', 403);
      }

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          job_id,
          sender_id: userId,
          content,
        })
        .select()
        .single();

      if (error || !message) {
        throw new AppError('Failed to send message', 500);
      }

      // Create notification for the other party
      const recipientId = job.customer_id === userId ? job.worker_id : job.customer_id;
      if (recipientId) {
        await supabase.from('notifications').insert({
          user_id: recipientId,
          type: 'MESSAGE_RECEIVED',
          payload: {
            job_id,
            sender_id: userId,
          },
        });
      }

      res.status(201).json({
        success: true,
        data: message as Message,
      });
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Failed to send message', 500));
    }
  }
);

export default router;
