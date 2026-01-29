import Stripe from 'stripe';
import { getEnv } from './env';

let stripeInstance: Stripe;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const env = getEnv();
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return stripeInstance;
}

export function getPlatformFeePercent(): number {
  const env = getEnv();
  return parseFloat(env.PLATFORM_FEE_PERCENT);
}
