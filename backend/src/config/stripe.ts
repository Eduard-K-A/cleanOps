// Stubbed stripe config: Stripe is intentionally removed for mock payments.
import { getEnv } from './env';

export function getPlatformFeePercent(): number {
  const env = getEnv();
  return parseFloat(env.PLATFORM_FEE_PERCENT);
}

export function getStripe(): never {
  throw new Error('Stripe is disabled in this build; use the mock payment module instead.');
}
