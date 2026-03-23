"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = createPaymentIntent;
exports.cancelPaymentIntent = cancelPaymentIntent;
exports.capturePaymentIntent = capturePaymentIntent;
exports.createTransfer = createTransfer;
exports.createExpressAccount = createExpressAccount;
exports.createAccountLink = createAccountLink;
exports.retrieveAccount = retrieveAccount;
exports.constructEvent = constructEvent;
exports._resetMocks = _resetMocks;
exports.getPlatformFeePercent = getPlatformFeePercent;
const paymentIntents = new Map();
const transfers = new Map();
const stripeAccounts = new Map();
const accountLinks = new Map();
function genId(prefix = 'pi') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
async function createPaymentIntent(opts) {
    const id = genId('pi');
    const intent = {
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
async function cancelPaymentIntent(id) {
    const intent = paymentIntents.get(id);
    if (!intent)
        return null;
    intent.status = 'canceled';
    paymentIntents.set(id, intent);
    return intent;
}
async function capturePaymentIntent(id) {
    const intent = paymentIntents.get(id);
    if (!intent) {
        throw new Error('PaymentIntent not found');
    }
    intent.status = 'succeeded';
    paymentIntents.set(id, intent);
    return intent;
}
async function createTransfer(opts) {
    const id = genId('tr');
    const transfer = {
        id,
        amount: opts.amount,
        currency: opts.currency,
        destination: opts.destination,
        metadata: opts.metadata,
    };
    transfers.set(id, transfer);
    return transfer;
}
async function createExpressAccount(opts) {
    const id = genId('acct');
    const account = {
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
async function createAccountLink(opts) {
    const account = stripeAccounts.get(opts.account);
    if (!account) {
        throw new Error('Account not found');
    }
    // Simulate onboarding completion for mock
    account.details_submitted = true;
    account.charges_enabled = true;
    account.payouts_enabled = true;
    stripeAccounts.set(opts.account, account);
    const link = {
        url: `${opts.return_url}?onboarding=completed`,
        expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    accountLinks.set(opts.account, link);
    return link;
}
async function retrieveAccount(accountId) {
    const account = stripeAccounts.get(accountId);
    if (!account) {
        throw new Error('Account not found');
    }
    return account;
}
// Mimic Stripe's webhook constructEvent signature. For the mock we simply parse the body.
function constructEvent(rawBody, _sig, _secret) {
    // If body is raw buffer (express.raw), try to parse; if already object, return.
    try {
        const body = typeof rawBody === 'string' || rawBody instanceof String
            ? JSON.parse(rawBody)
            : rawBody;
        return body;
    }
    catch (err) {
        throw new Error('Failed to parse webhook body');
    }
}
function _resetMocks() {
    paymentIntents.clear();
    transfers.clear();
}
exports.default = {
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
const env_1 = require("./env");
function getPlatformFeePercent() {
    const env = (0, env_1.getEnv)();
    return parseFloat(env.PLATFORM_FEE_PERCENT);
}
//# sourceMappingURL=payment.js.map