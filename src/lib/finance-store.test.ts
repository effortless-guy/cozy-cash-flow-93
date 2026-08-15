import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as db from './db';
import { useSalary, useKhatabook } from './finance-store';

// Robust mock for the DB module
vi.mock('./db', () => ({
  getDBItem: vi.fn(),
  setDBItem: vi.fn().mockResolvedValue(undefined),
  migrateFromLocalStorage: vi.fn().mockResolvedValue(undefined),
  STORE_MAP: {
    "pft.salary.v1": "salary",
    "pft.subs.v1": "subscriptions",
    "pft.settings.v1": "settings",
    "pft.khatabook.v1": "khatabook",
    "pft.networth.v1": "networth",
    "pft.nw_activity.v1": "nw_activity"
  }
}));

describe('Finance Store Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getDBItem).mockResolvedValue(null);
  });

  describe('useSalary', () => {
    it('calculates totals correctly', async () => {
      const { result } = renderHook(() => useSalary());

      // Instead of act(async () => await new Promise...), we just act() synchronously
      // to let React handle the immediate effects.
      // If the hook is stuck in hydration, it means getDBItem never resolved.
      // But we mock it with mockResolvedValue.

      // We'll give it a moment to resolve the promise from getDBItem
      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        result.current.addCategory('Test Category');
      });

      const categories = result.current.currentMonth.categories;
      const category = categories.find((c: any) => c.name === 'Test Category');
      expect(category).toBeDefined();

      act(() => {
        result.current.addTransaction(category!.id, 'Item 1', 100);
        result.current.addTransaction(category!.id, 'Item 2', 50);
      });

      const updatedCategory = result.current.currentMonth.categories.find((c: any) => c.id === category!.id);
      const total = updatedCategory?.transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      expect(total).toBe(150);
    });
  });

  describe('useKhatabook', () => {
    it('manages people and entries correctly', async () => {
      const { result } = renderHook(() => useKhatabook());
      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        result.current.addPerson('John Doe');
      });

      const person = result.current.people.find((p: any) => p.name === 'John Doe');
      expect(person).toBeDefined();

      act(() => {
        result.current.addEntry(person!.id, {
          note: 'Lent money',
          amount: 500,
          type: 'lent',
          date: '2026-08-15'
        });
      });

      const updatedPerson = result.current.people.find((p: any) => p.name === 'John Doe');
      expect(updatedPerson?.entries.length).toBe(1);
      expect(updatedPerson?.entries[0].amount).toBe(500);
    });
  });
});
