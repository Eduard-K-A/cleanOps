import { Router, Request, Response } from 'express';
import money from '../config/money';
import { getSupabaseAdmin } from '../config/supabase';
import { ApiResponse, Profile } from '../types';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const supabase = getSupabaseAdmin() as any;

/**
 * Add mock money to the authenticated user's balance
 */
router.post('/add-money', verifyAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { amount } = req.body || {};

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount: must be a positive number', code: 400 });
  }

  try {
    // Add money to user's balance
    const updatedMoney = await money.addMoney(userId, amount, 'USD');

    // Update profile in database with the new balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ money_balance: updatedMoney.balance })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update profile money balance:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to save money balance', code: 500 });
    }

    res.json({
      success: true,
      data: {
        balance: updatedMoney.balance,
        currency: updatedMoney.currency,
        message: `Added $${amount.toFixed(2)} to your account`,
      },
    });
  } catch (error: any) {
    console.error('Add money error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to add money: ${error.message || 'Unknown error'}`,
      code: 500,
    });
  }
}));

/**
 * Get the authenticated user's money balance
 */
router.get('/balance', verifyAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  try {
    // Get balance from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('money_balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(400).json({ success: false, error: 'Profile not found', code: 400 });
    }

    res.json({
      success: true,
      data: {
        balance: profile.money_balance || 0,
        currency: 'USD',
      },
    });
  } catch (error: any) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: `Failed to get balance: ${error.message || 'Unknown error'}`,
      code: 500,
    });
  }
}));

/**
 * Confirm a mock payment (money authorization) for a job
 * This simulates customer authorizing payment for a job
 */
router.post('/confirm', verifyAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { jobId, amount } = req.body || {};

  if (!jobId || !amount) {
    return res.status(400).json({ success: false, error: 'Missing jobId or amount', code: 400 });
  }

  try {
    // Get user's current balance
    const userMoney = await money.getMoney(userId);
    if (!userMoney || userMoney.balance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient funds', code: 400 });
    }

    // Create a mock money hold (for demo purposes, just log it)
    // In a real system, you'd create an escrow or hold
    console.log(`Mock payment authorization for job ${jobId}: $${amount} from user ${userId}`);

    res.json({
      success: true,
      data: {
        jobId,
        amountAuthorized: amount,
        message: 'Payment authorized (mock). Funds are held in escrow until you approve the job.',
      },
    });
  } catch (error: any) {
    console.error('Payment confirm error:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm payment', code: 500 });
  }
}));

export default router;
