import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as db from './db';
import { useSalary, useKhatabook, useNetWorth } from './finance-store';

// Mock the DB module
vi.mock('./db', () => ({
  getDBItem: vi.fn(),
  setDBItem: vi.fn(),
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
    vi.mocked(db.setDBItem).mockResolvedValue(undefined);
  });

  describe('useSalary', () => {
    it('calculates totals correctly', async () => {
      let resultObj: any;
      await act(async () => {
        const { result } = renderHook(() => useSalary());
        resultObj = result;
        // The store hydrates in a useEffect after mount
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(resultObj.current.hydrated).toBe(true);

      act(() => {
        resultObj.current.addCategory('Test Category');
      });

      const categories = resultObj.current.currentMonth.categories;
      const categoryId = categories[categories.length - 1].id;

      act(() => {
        resultObj.current.addTransaction(categoryId, 'Item 1', 100);
        resultObj.current.addTransaction(categoryId, 'Item 2', 50);
      });

      const updatedCategories = resultObj.current.currentMonth.categories;
      const category = updatedCategories.find((c: any) => c.id === categoryId);
      
      const total = category?.transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      expect(total).toBe(150);
    });
  });

  describe('useKhatabook', () => {
    it('manages people and entries correctly', async () => {
      let resultObj: any;
      await act(async () => {
        const { result } = renderHook(() => useKhatabook());
        resultObj = result;
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(resultObj.current.hydrated).toBe(true);

      act(() => {
        resultObj.current.addPerson('John Doe');
      });

      const person = resultObj.current.people.find((p: any) => p.name === 'John Doe');
      expect(person).toBeDefined();

      act(() => {
        resultObj.current.addEntry(person!.id, {
          note: 'Lent money',
          amount: 500,
          type: 'lent',
          date: '2026-08-15'
        });
      });

      const updatedPerson = resultObj.current.people.find((p: any) => p.name === 'John Doe');
      expect(updatedPerson?.entries.length).toBe(1);
      expect(updatedPerson?.entries[0].amount).toBe(500);
    });
  });

  describe('useNetWorth', () => {
    it('initializes default assets and updates values', async () => {
      let resultObj: any;
      await act(async () => {
        const { result } = renderHook(() => useNetWorth());
        resultObj = result;
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(resultObj.current.hydrated).toBe(true);

      // Should have default assets
      expect(resultObj.current.assets.length).toBeGreaterThan(0);
      
      const stocks = resultObj.current.assets.find((a: any) => a.type === 'Stocks');
      expect(stocks).toBeDefined();

      act(() => {
        resultObj.current.addEntry(stocks!.id, {
          amount: 1000,
          date: '2026-08-15',
          note: 'Bought shares'
        });
      });

      const updatedStocks = resultObj.current.assets.find((a: any) => a.id === stocks!.id);
      expect(updatedStocks?.entries.length).toBe(1);
    });
  });
});
