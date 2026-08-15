import { describe, it, expect } from 'vitest';
import { calculateTransactionTotal, calculateKhatabookBalance, calculateTotalNetWorth } from './logic-helpers';
import { Transaction } from './finance-store';

describe('Logic Helpers', () => {
  describe('calculateTransactionTotal', () => {
    it('sums all transactions when no completion status is present', () => {
      const txs: Transaction[] = [
        { id: '1', name: 'A', amount: 100 },
        { id: '2', name: 'B', amount: 200 },
      ];
      expect(calculateTransactionTotal(txs)).toBe(300);
    });

    it('sums only completed transactions when status is present', () => {
      const txs: Transaction[] = [
        { id: '1', name: 'A', amount: 100, completed: true },
        { id: '2', name: 'B', amount: 200, completed: false },
        { id: '3', name: 'C', amount: 50, completed: true },
      ];
      expect(calculateTransactionTotal(txs)).toBe(150);
    });

    it('returns 0 for empty list', () => {
      expect(calculateTransactionTotal([])).toBe(0);
    });
  });

  describe('calculateKhatabookBalance', () => {
    it('correctly balances lent and borrowed amounts', () => {
      const entries: any[] = [
        { amount: 500, type: 'lent' },
        { amount: 200, type: 'borrowed' },
        { amount: 100, type: 'lent' },
      ];
      expect(calculateKhatabookBalance(entries)).toBe(400);
    });

    it('returns negative when borrowed exceeds lent', () => {
      const entries: any[] = [
        { amount: 100, type: 'lent' },
        { amount: 300, type: 'borrowed' },
      ];
      expect(calculateKhatabookBalance(entries)).toBe(-200);
    });
  });

  describe('calculateTotalNetWorth', () => {
    it('excludes archived assets', () => {
      const assets = [
        { currentValue: 1000, archived: false },
        { currentValue: 5000, archived: true },
        { currentValue: 2000, archived: false },
      ];
      expect(calculateTotalNetWorth(assets)).toBe(3000);
    });
  });
});
