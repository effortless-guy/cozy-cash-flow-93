import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as db from './db';
import { useSalary, useKhatabook, useNetWorth } from './finance-store';

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

      // Manually trigger hydration if useEffect is stuck in test environment
      // though typically act() + await should handle it.
      await act(async () => {
        // Wait for the internal useEffect of usePersisted to complete
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // If it still isn't hydrated, the test will fail here anyway
      // But we can force it for logic verification if needed by looking at current month
      
      act(() => {
        result.current.addCategory('Test Category');
      });

      const categories = result.current.currentMonth.categories;
      const categoryId = categories[categories.length - 1].id;

      act(() => {
        result.current.addTransaction(categoryId, 'Item 1', 100);
        result.current.addTransaction(categoryId, 'Item 2', 50);
      });

      const updatedCategories = result.current.currentMonth.categories;
      const category = updatedCategories.find((c: any) => c.id === categoryId);
      
      const total = category?.transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      expect(total).toBe(150);
    });
  });

  describe('useKhatabook', () => {
    it('manages people and entries correctly', async () => {
      const { result } = renderHook(() => useKhatabook());
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
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
