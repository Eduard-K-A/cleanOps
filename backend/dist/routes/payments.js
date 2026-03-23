"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const router = (0, express_1.Router)();
const supabase = (0, supabase_1.getSupabaseAdmin)();
// Simple mock confirmation endpoint to simulate client-side card authorization.
router.post('/confirm', async (req, res) => {
    try {
        const { jobId, clientSecret } = req.body || {};
        if (!jobId || !clientSecret) {
            return res.status(400).json({ success: false, error: 'Missing jobId or clientSecret', code: 400 });
        }
        // In the mock we don't need to validate the clientSecret; optionally log it.
        console.log('Mock payment confirm for job:', jobId);
        // Return success — real capture will happen on approval flow.
        res.json({ success: true });
    }
    catch (err) {
        console.error('Payment confirm error:', err);
        res.status(500).json({ success: false, error: 'Failed to confirm payment', code: 500 });
    }
});
exports.default = router;
//# sourceMappingURL=payments.js.map