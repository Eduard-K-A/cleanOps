"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../config/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
// Supabase table typing may resolve to `never` without a generated Database type.
// Cast here to keep route handlers compiling cleanly.
const supabase = (0, supabase_1.getSupabaseAdmin)();
router.use(auth_1.verifyAuth);
/**
 * Get user notifications
 */
router.get('/', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.id;
        const { is_read, limit = '50' } = req.query;
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit, 10));
        if (is_read !== undefined) {
            query = query.eq('is_read', is_read === 'true');
        }
        const { data: notifications, error } = await query;
        if (error) {
            throw new errorHandler_1.AppError('Failed to fetch notifications', 500);
        }
        res.json({
            success: true,
            data: notifications,
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to fetch notifications', 500);
    }
}));
/**
 * Mark notification as read
 */
router.patch('/:id/read', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { data: notification, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error || !notification) {
            throw new errorHandler_1.AppError('Notification not found', 404);
        }
        res.json({
            success: true,
            data: notification,
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to update notification', 500);
    }
}));
/**
 * Mark all notifications as read
 */
router.post('/read-all', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const userId = req.user.id;
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) {
            throw new errorHandler_1.AppError('Failed to update notifications', 500);
        }
        res.json({
            success: true,
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError)
            throw error;
        throw new errorHandler_1.AppError('Failed to update notifications', 500);
    }
}));
exports.default = router;
//# sourceMappingURL=notifications.js.map