type PaymentIntent = {
  id: string;
  client_secret?: string;
  status: 'requires_capture' | 'succeeded' | 'canceled' | 'requires_payment_method';
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
};

type Transfer = {
  id: string;
  amount: number;
  currency: string;
  destination: string;
  metadata?: Record<string, any>;
};

const paymentIntents = new Map<string, PaymentIntent>();
const transfers = new Map<string, Transfer>();

function genId(prefix = 'pi') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createPaymentIntent(opts: {
  amount: number;
  currency: string;
  capture_method?: string;
  metadata?: Record<string, any>;
}): Promise<PaymentIntent> {
  const id = genId('pi');
  const intent: PaymentIntent = {
    id,
    client_secret: `${id}_secret_${Math.random().toString(36).slice(2, 8)}`,
    status: opts.capture_method === 'manual' ? 'requires_capture' : 'succeeded',
    amount: opts.amount,
    currency: opts.currency,
    metadata: opts.metadata,
  };
  paymentIntents.set(id, intent);
  return intent;
}

export async function cancelPaymentIntent(id: string): Promise<PaymentIntent | null> {
  const intent = paymentIntents.get(id);
  if (!intent) return null;
  intent.status = 'canceled';
  paymentIntents.set(id, intent);
  return intent;
}

export async function capturePaymentIntent(id: string): Promise<PaymentIntent> {
  const intent = paymentIntents.get(id);
  if (!intent) {
    throw new Error('PaymentIntent not found');
  }
  intent.status = 'succeeded';
  paymentIntents.set(id, intent);
  return intent;
}

export async function createTransfer(opts: {
  amount: number;
  currency: string;
  destination: string;
  metadata?: Record<string, any>;
}): Promise<Transfer> {
  const id = genId('tr');
  const transfer: Transfer = {
    id,
    amount: opts.amount,
    currency: opts.currency,
    destination: opts.destination,
    metadata: opts.metadata,
  };
  transfers.set(id, transfer);
  return transfer;
}

// Mimic Stripe's webhook constructEvent signature. For the mock we simply parse the body.
export function constructEvent(rawBody: any, _sig: any, _secret: any) {
  // If body is raw buffer (express.raw), try to parse; if already object, return.
  try {
    const body = typeof rawBody === 'string' || rawBody instanceof String
      ? JSON.parse(rawBody as string)
      : rawBody;
    return body;
  } catch (err) {
    throw new Error('Failed to parse webhook body');
  }
}

export function _resetMocks() {
  paymentIntents.clear();
  transfers.clear();
}

export default {
  createPaymentIntent,
  cancelPaymentIntent,
  capturePaymentIntent,
  createTransfer,
  constructEvent,
  _resetMocks,
};

// Expose platform fee helper so callers don't need stripe config
import { getEnv } from './env';

export function getPlatformFeePercent(): number {
  const env = getEnv();
  return parseFloat(env.PLATFORM_FEE_PERCENT);
}
