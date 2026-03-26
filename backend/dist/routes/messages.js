"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const supabase_1 = require("../config/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// Supabase table typing may resolve to `never` without a generated Database type.
// Cast here to keep route handlers compiling cleanly.
const supabase = (0, supabase_1.getSupabaseAdmin)();
router.use(auth_1.verifyAuth);
/**
 * Get messages for a job
 */
router.get('/job/:job_id', (0, validate_1.validate)({
    params: zod_1.z.object({
        job_id: zod_1.z.string().uuid(),
    }),
}), async (req, res, next) => {
    try {
        const { job_id } = req.params;
        const userId = req.user.id;
        // Verify user has access to this job
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('customer_id, worker_id')
            .eq('id', job_id)
            .single();
        if (jobError || !job) {
            throw new errorHandler_1.AppError('Job not found', 404);
        }
        if (job.customer_id !== userId && job.worker_id !== userId) {
            throw new errorHandler_1.AppError('Unauthorized', 403);
        }
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('job_id', job_id)
            .order('created_at', { ascending: true });
        if (error) {
            throw new errorHandler_1.AppError('Failed to fetch messages', 500);
        }
        res.json({
            success: true,
            data: messages,
        });
    }
    catch (error) {
        next(error instanceof errorHandler_1.AppError ? error : new errorHandler_1.AppError('Failed to fetch messages', 500));
    }
});
/**
 * Send a message
 */
router.post('/', (0, validate_1.validate)({
    body: zod_1.z.object({
        job_id: zod_1.z.string().uuid(),
        content: zod_1.z.string().min(1).max(1000),
    }),
}), async (req, res, next) => {
    try {
        const { job_id, content } = req.body;
        const userId = req.user.id;
        // Verify user has access to this job
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('customer_id, worker_id')
            .eq('id', job_id)
            .single();
        if (jobError || !job) {
            throw new errorHandler_1.AppError('Job not found', 404);
        }
        if (job.customer_id !== userId && job.worker_id !== userId) {
            throw new errorHandler_1.AppError('Unauthorized', 403);
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
            throw new errorHandler_1.AppError('Failed to send message', 500);
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
            data: message,
        });
    }
    catch (error) {
        next(error instanceof errorHandler_1.AppError ? error : new errorHandler_1.AppError('Failed to send message', 500));
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map