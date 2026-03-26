"use strict";
// Mock Money System: Replaces Stripe with a simple in-memory money balance system
Object.defineProperty(exports, "__esModule", { value: true });
exports.money = void 0;
exports.addMoney = addMoney;
exports.setMoney = setMoney;
exports.getMoney = getMoney;
exports.transferMoney = transferMoney;
exports.depositMoney = depositMoney;
exports.getTransactionHistory = getTransactionHistory;
exports.getTransaction = getTransaction;
exports._resetMocks = _resetMocks;
const userBalances = new Map();
const transactions = new Map();
function genId(prefix = 'txn') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
/**
 * Add or update a user's money balance
 */
async function addMoney(userId, amount, currency = 'USD') {
    const existing = userBalances.get(userId);
    const money = {
        userId,
        balance: (existing?.balance || 0) + amount,
        currency,
        updated_at: new Date().toISOString(),
    };
    userBalances.set(userId, money);
    return money;
}
/**
 * Set a user's money balance to a specific amount
 */
async function setMoney(userId, amount, currency = 'USD') {
    const money = {
        userId,
        balance: amount,
        currency,
        updated_at: new Date().toISOString(),
    };
    userBalances.set(userId, money);
    return money;
}
/**
 * Get a user's current money balance
 */
async function getMoney(userId) {
    return userBalances.get(userId) || null;
}
/**
 * Transfer money from one user to another
 */
async function transferMoney(opts) {
    const fromBalance = userBalances.get(opts.fromUserId);
    if (!fromBalance || fromBalance.balance < opts.amount) {
        throw new Error('Insufficient funds');
    }
    const txnId = genId('txn');
    const transaction = {
        id: txnId,
        fromUserId: opts.fromUserId,
        toUserId: opts.toUserId,
        amount: opts.amount,
        currency: opts.currency || 'USD',
        type: 'transfer',
        description: opts.description,
        metadata: opts.metadata,
        created_at: new Date().toISOString(),
    };
    // Deduct from sender
    fromBalance.balance -= opts.amount;
    fromBalance.updated_at = new Date().toISOString();
    userBalances.set(opts.fromUserId, fromBalance);
    // Add to receiver
    const toBalance = userBalances.get(opts.toUserId) || {
        userId: opts.toUserId,
        balance: 0,
        currency: opts.currency || 'USD',
        updated_at: new Date().toISOString(),
    };
    toBalance.balance += opts.amount;
    toBalance.updated_at = new Date().toISOString();
    userBalances.set(opts.toUserId, toBalance);
    // Record transaction
    transactions.set(txnId, transaction);
    return transaction;
}
/**
 * Record a deposit transaction (admin adds money to user)
 */
async function depositMoney(opts) {
    const txnId = genId('dep');
    const transaction = {
        id: txnId,
        fromUserId: 'system',
        toUserId: opts.userId,
        amount: opts.amount,
        currency: opts.currency || 'USD',
        type: 'deposit',
        description: opts.description,
        created_at: new Date().toISOString(),
    };
    // Add to user's balance
    const balance = userBalances.get(opts.userId) || {
        userId: opts.userId,
        balance: 0,
        currency: opts.currency || 'USD',
        updated_at: new Date().toISOString(),
    };
    balance.balance += opts.amount;
    balance.updated_at = new Date().toISOString();
    userBalances.set(opts.userId, balance);
    // Record transaction
    transactions.set(txnId, transaction);
    return transaction;
}
/**
 * Get transaction history for a user
 */
async function getTransactionHistory(userId) {
    const userTxns = [];
    transactions.forEach((txn) => {
        if (txn.fromUserId === userId || txn.toUserId === userId) {
            userTxns.push(txn);
        }
    });
    return userTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
/**
 * Get all transaction details
 */
async function getTransaction(transactionId) {
    return transactions.get(transactionId) || null;
}
/**
 * Reset mock system (for testing)
 */
function _resetMocks() {
    userBalances.clear();
    transactions.clear();
}
// Expose a simple mock money variable for clarity and easy debugging
exports.money = {
    userBalances,
    transactions,
};
exports.default = {
    addMoney,
    setMoney,
    getMoney,
    transferMoney,
    depositMoney,
    getTransactionHistory,
    getTransaction,
    _resetMocks,
    money: exports.money,
};
//# sourceMappingURL=money.js.map