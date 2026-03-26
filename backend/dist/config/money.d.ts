export type Money = {
    userId: string;
    balance: number;
    currency: string;
    updated_at: string;
};
export type MoneyTransaction = {
    id: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: string;
    type: 'transfer' | 'deposit' | 'withdrawal';
    description?: string;
    metadata?: Record<string, any>;
    created_at: string;
};
/**
 * Add or update a user's money balance
 */
export declare function addMoney(userId: string, amount: number, currency?: string): Promise<Money>;
/**
 * Set a user's money balance to a specific amount
 */
export declare function setMoney(userId: string, amount: number, currency?: string): Promise<Money>;
/**
 * Get a user's current money balance
 */
export declare function getMoney(userId: string): Promise<Money | null>;
/**
 * Transfer money from one user to another
 */
export declare function transferMoney(opts: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency?: string;
    description?: string;
    metadata?: Record<string, any>;
}): Promise<MoneyTransaction>;
/**
 * Record a deposit transaction (admin adds money to user)
 */
export declare function depositMoney(opts: {
    userId: string;
    amount: number;
    currency?: string;
    description?: string;
}): Promise<MoneyTransaction>;
/**
 * Get transaction history for a user
 */
export declare function getTransactionHistory(userId: string): Promise<MoneyTransaction[]>;
/**
 * Get all transaction details
 */
export declare function getTransaction(transactionId: string): Promise<MoneyTransaction | null>;
/**
 * Reset mock system (for testing)
 */
export declare function _resetMocks(): void;
export declare const money: {
    userBalances: Map<string, Money>;
    transactions: Map<string, MoneyTransaction>;
};
declare const _default: {
    addMoney: typeof addMoney;
    setMoney: typeof setMoney;
    getMoney: typeof getMoney;
    transferMoney: typeof transferMoney;
    depositMoney: typeof depositMoney;
    getTransactionHistory: typeof getTransactionHistory;
    getTransaction: typeof getTransaction;
    _resetMocks: typeof _resetMocks;
    money: {
        userBalances: Map<string, Money>;
        transactions: Map<string, MoneyTransaction>;
    };
};
export default _default;
//# sourceMappingURL=money.d.ts.map