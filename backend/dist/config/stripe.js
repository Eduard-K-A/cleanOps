"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformFeePercent = getPlatformFeePercent;
exports.getStripe = getStripe;
// Stubbed stripe config: Stripe is intentionally removed for mock payments.
const env_1 = require("./env");
function getPlatformFeePercent() {
    const env = (0, env_1.getEnv)();
    return parseFloat(env.PLATFORM_FEE_PERCENT);
}
function getStripe() {
    throw new Error('Stripe is disabled in this build; use the mock payment module instead.');
}
//# sourceMappingURL=stripe.js.map