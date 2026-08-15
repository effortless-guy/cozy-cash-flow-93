import { describe, it, expect } from 'vitest';

const calculateTotal = (transactions: { amount: number }[]) => 
  transactions.reduce((sum, t) => sum + t.amount, 0);

describe('Finance Logic Helpers', () => {
  it('calculates totals correctly', () => {
    const transactions = [
      { amount: 100 },
      { amount: 50.5 },
      { amount: 200 }
    ];
    expect(calculateTotal(transactions)).toBe(350.5);
  });

  it('handles empty transactions', () => {
    expect(calculateTotal([])).toBe(0);
  });
});
