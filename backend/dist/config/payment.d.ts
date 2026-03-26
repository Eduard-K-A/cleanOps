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
        card_payments: {
            requested: boolean;
        };
        transfers: {
            requested: boolean;
        };
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
export declare function createPaymentIntent(opts: {
    amount: number;
    currency: string;
    capture_method?: string;
    metadata?: Record<string, any>;
}): Promise<PaymentIntent>;
export declare function cancelPaymentIntent(id: string): Promise<PaymentIntent | null>;
export declare function capturePaymentIntent(id: string): Promise<PaymentIntent>;
export declare function createTransfer(opts: {
    amount: number;
    currency: string;
    destination: string;
    metadata?: Record<string, any>;
}): Promise<Transfer>;
export declare function createExpressAccount(opts: {
    type: 'express';
    country: string;
    email: string;
    capabilities: {
        card_payments: {
            requested: boolean;
        };
        transfers: {
            requested: boolean;
        };
    };
    business_type: 'individual' | 'company';
}): Promise<StripeAccount>;
export declare function createAccountLink(opts: {
    account: string;
    refresh_url: string;
    return_url: string;
    type: 'account_onboarding';
}): Promise<AccountLink>;
export declare function retrieveAccount(accountId: string): Promise<StripeAccount>;
export declare function constructEvent(rawBody: any, _sig: any, _secret: any): any;
export declare function _resetMocks(): void;
declare const _default: {
    createPaymentIntent: typeof createPaymentIntent;
    cancelPaymentIntent: typeof cancelPaymentIntent;
    capturePaymentIntent: typeof capturePaymentIntent;
    createTransfer: typeof createTransfer;
    createExpressAccount: typeof createExpressAccount;
    createAccountLink: typeof createAccountLink;
    retrieveAccount: typeof retrieveAccount;
    constructEvent: typeof constructEvent;
    _resetMocks: typeof _resetMocks;
};
export default _default;
export declare function getPlatformFeePercent(): number;
//# sourceMappingURL=payment.d.ts.map