import { Router, Request, Response } from 'express';
import payment from '../config/payment';
import { getSupabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../types';

const router = Router();
const supabase = getSupabaseAdmin();

// Simple mock confirmation endpoint to simulate client-side card authorization.
router.post('/confirm', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { jobId, clientSecret } = req.body || {};
    if (!jobId || !clientSecret) {
      return res.status(400).json({ success: false, error: 'Missing jobId or clientSecret', code: 400 });
    }

    // In the mock we don't need to validate the clientSecret; optionally log it.
    console.log('Mock payment confirm for job:', jobId);

    // Return success — real capture will happen on approval flow.
    res.json({ success: true });
  } catch (err: any) {
    console.error('Payment confirm error:', err);
    res.status(500).json({ success: false, error: 'Failed to confirm payment', code: 500 });
  }
});

export default router;
