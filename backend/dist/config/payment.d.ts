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
export declare function constructEvent(rawBody: any, _sig: any, _secret: any): any;
export declare function _resetMocks(): void;
declare const _default: {
    createPaymentIntent: typeof createPaymentIntent;
    cancelPaymentIntent: typeof cancelPaymentIntent;
    capturePaymentIntent: typeof capturePaymentIntent;
    createTransfer: typeof createTransfer;
    constructEvent: typeof constructEvent;
    _resetMocks: typeof _resetMocks;
};
export default _default;
export declare function getPlatformFeePercent(): number;
//# sourceMappingURL=payment.d.ts.map