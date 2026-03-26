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

type StripeAccount = {
  id: string;
  type: 'express';
  country: string;
  email: string;
  capabilities: {
    card_payments: { requested: boolean };
    transfers: { requested: boolean };
  };
  business_type: 'individual' | 'company';
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
};

type AccountLink = {
  url: string;
  expires_at: number;
};

const paymentIntents = new Map<string, PaymentIntent>();
const transfers = new Map<string, Transfer>();
const stripeAccounts = new Map<string, StripeAccount>();
const accountLinks = new Map<string, AccountLink>();

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

export async function createExpressAccount(opts: {
  type: 'express';
  country: string;
  email: string;
  capabilities: {
    card_payments: { requested: boolean };
    transfers: { requested: boolean };
  };
  business_type: 'individual' | 'company';
}): Promise<StripeAccount> {
  const id = genId('acct');
  const account: StripeAccount = {
    id,
    type: opts.type,
    country: opts.country,
    email: opts.email,
    capabilities: opts.capabilities,
    business_type: opts.business_type,
    details_submitted: false,
    charges_enabled: false,
    payouts_enabled: false,
  };
  stripeAccounts.set(id, account);
  return account;
}

export async function createAccountLink(opts: {
  account: string;
  refresh_url: string;
  return_url: string;
  type: 'account_onboarding';
}): Promise<AccountLink> {
  const account = stripeAccounts.get(opts.account);
  if (!account) {
    throw new Error('Account not found');
  }

  // Simulate onboarding completion for mock
  account.details_submitted = true;
  account.charges_enabled = true;
  account.payouts_enabled = true;
  stripeAccounts.set(opts.account, account);

  const link: AccountLink = {
    url: `${opts.return_url}?onboarding=completed`,
    expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  accountLinks.set(opts.account, link);
  return link;
}

export async function retrieveAccount(accountId: string): Promise<StripeAccount> {
  const account = stripeAccounts.get(accountId);
  if (!account) {
    throw new Error('Account not found');
  }
  return account;
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
  createExpressAccount,
  createAccountLink,
  retrieveAccount,
  constructEvent,
  _resetMocks,
};

// Expose platform fee helper so callers don't need stripe config
import { getEnv } from './env';

export function getPlatformFeePercent(): number {
  const env = getEnv();
  return parseFloat(env.PLATFORM_FEE_PERCENT);
}
