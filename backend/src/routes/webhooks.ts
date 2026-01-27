import express, { Router, Request, Response } from 'express';
import { getStripe } from '../config/stripe';
import { getEnv } from '../config/env';
import { getSupabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../types';

const router = Router();
const stripe = getStripe();
const supabase = getSupabaseAdmin();

/**
 * Stripe webhook endpoint
 * Handles payment events
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response<ApiResponse>) => {
    const sig = req.headers['stripe-signature'];
    const env = getEnv();

    if (!sig) {
      return res.status(400).json({
        success: false,
        error: 'Missing stripe-signature header',
        code: 400,
      });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
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
