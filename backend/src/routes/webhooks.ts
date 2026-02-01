import express, { Router, Request, Response } from 'express';
import payment from '../config/payment';
// import { getEnv } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../types';

const router = Router();
const supabase = getSupabaseAdmin();

/**
 * Stripe webhook endpoint
 * Handles payment events
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response<ApiResponse>) => {
    // For the mock payment provider we do not enforce signatures; parse body.
    let event;
    try {
      event = payment.constructEvent(req.body, undefined, undefined);
    } catch (err: any) {
      console.error('Webhook parse failed:', err.message);
      return res.status(400).json({
        success: false,
        error: `Webhook Error: ${err.message}`,
        code: 400,
      });
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('PaymentIntent succeeded:', event.data.object.id);
          // Payment captured successfully
          break;

        case 'payment_intent.payment_failed':
          console.log('PaymentIntent failed:', event.data.object.id);
          // Handle failed payment
          break;

        case 'transfer.created':
          console.log('Transfer created:', event.data.object.id);
          // Transfer to worker account created
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({
        success: false,
        error: 'Webhook handler failed',
        code: 500,
      });
    }
  }
);

export default router;
