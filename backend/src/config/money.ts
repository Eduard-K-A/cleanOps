// Mock Money System: Replaces Stripe with a simple in-memory money balance system

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

const userBalances = new Map<string, Money>();
const transactions = new Map<string, MoneyTransaction>();

function genId(prefix = 'txn'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Add or update a user's money balance
 */
export async function addMoney(userId: string, amount: number, currency = 'USD'): Promise<Money> {
  const existing = userBalances.get(userId);
  const money: Money = {
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
export async function setMoney(userId: string, amount: number, currency = 'USD'): Promise<Money> {
  const money: Money = {
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
export async function getMoney(userId: string): Promise<Money | null> {
  return userBalances.get(userId) || null;
}

/**
 * Transfer money from one user to another
 */
export async function transferMoney(opts: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<MoneyTransaction> {
  const fromBalance = userBalances.get(opts.fromUserId);
  if (!fromBalance || fromBalance.balance < opts.amount) {
    throw new Error('Insufficient funds');
  }

  const txnId = genId('txn');
  const transaction: MoneyTransaction = {
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
export async function depositMoney(opts: {
  userId: string;
  amount: number;
  currency?: string;
  description?: string;
}): Promise<MoneyTransaction> {
  const txnId = genId('dep');
  const transaction: MoneyTransaction = {
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
export async function getTransactionHistory(userId: string): Promise<MoneyTransaction[]> {
  const userTxns: MoneyTransaction[] = [];
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
export async function getTransaction(transactionId: string): Promise<MoneyTransaction | null> {
  return transactions.get(transactionId) || null;
}

/**
 * Reset mock system (for testing)
 */
export function _resetMocks(): void {
  userBalances.clear();
  transactions.clear();
}

// Expose a simple mock money variable for clarity and easy debugging
export const money = {
  userBalances,
  transactions,
};

export default {
  addMoney,
  setMoney,
  getMoney,
  transferMoney,
  depositMoney,
  getTransactionHistory,
  getTransaction,
  _resetMocks,
  money,
};
