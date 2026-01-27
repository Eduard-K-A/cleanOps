const { stripe } = require('../lib/stripe');
const { sendError } = require('../lib/errors');

/**
 * POST /api/webhooks/stripe — Stripe webhook handler.
 * Verify signature with STRIPE_WEBHOOK_SECRET; handle payment_intent.succeeded, etc.
 */
async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    return sendError(res, 'Webhook not configured', 500);
  }

  let event;
  try {
    const raw = req.body;
    const payload = Buffer.isBuffer(raw) ? raw.toString('utf8') : (typeof raw === 'string' ? raw : JSON.stringify(raw || ''));
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (e) {
    console.error('Stripe webhook signature verification failed:', e.message);
    return sendError(res, 'Invalid signature', 400);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Optional: sync state if needed. We capture server-side on approve.
        break;
      case 'payment_intent.payment_failed':
        // Log; optionally notify user.
        break;
      case 'account.updated':
        // Connect account updates; optionally sync stripe_account_id.
        break;
      default:
        break;
    }
    res.status(200).json({ received: true });
  } catch (e) {
    console.error('Webhook handler error:', e);
    return sendError(res, 'Webhook processing failed', 500);
  }
}

module.exports = { handleStripeWebhook };
