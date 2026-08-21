import { Transaction } from "./finance-store";

/**
 * Calculates the total amount for a list of transactions.
 * Only includes checked/completed transactions if they are provided, 
 * otherwise sums all transactions.
 */
export const calculateTransactionTotal = (transactions: Transaction[]) => {
  if (!transactions || transactions.length === 0) return 0;
  
  // If any transaction has a 'completed' status, we only sum those.
  // Otherwise, we sum everything (e.g., in a draft state).
  const hasStatus = transactions.some(t => t.completed !== undefined);
  
  if (hasStatus) {
    return transactions
      .filter(t => t.completed)
      .reduce((sum, t) => sum + t.amount, 0);
  }
  
  return transactions.reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculates the balance for a person in Khatabook.
 * Lent is positive, Borrowed is negative.
 */
export const calculateKhatabookBalance = (entries: { amount: number, type: 'lent' | 'borrowed' }[]) => {
  return entries.reduce((total, e) => total + (e.type === "lent" ? e.amount : -e.amount), 0);
};

/**
 * Aggregates net worth from a list of assets.
 */
export const calculateTotalNetWorth = (assets: { currentValue: number, archived?: boolean }[]) => {
  return assets
    .filter(a => !a.archived)
    .reduce((sum, a) => sum + a.currentValue, 0);
};

/**
 * Validates a backup object structure.
 */
export const validateBackup = (backup: any): boolean => {
  if (!backup || typeof backup !== 'object') return false;

  // Encrypted backup v3
  if (backup.version === 3 && backup.encrypted) {
    return typeof backup.payload === 'string';
  }

  const data = backup.data || backup;
  if (!data || typeof data !== 'object') return false;
  
  // Minimal requirement: at least one core finance store should be present
  const coreStores = ['salary', 'subscriptions', 'khatabook', 'networth', 'settings'];
  return coreStores.some(store => data[store] !== undefined);
};
