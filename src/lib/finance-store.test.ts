import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSalary, useKhatabook, useNetWorth } from './finance-store';

// Mock the DB module to be deterministic
vi.mock('./db', () => ({
  getDBItem: vi.fn().mockResolvedValue(null),
  setDBItem: vi.fn().mockResolvedValue(undefined),
  migrateFromLocalStorage: vi.fn().mockResolvedValue(undefined),
  STORE_MAP: {
    'pft.salary.v1': 'salary',
    'pft.subs.v1': 'subscriptions',
    'pft.settings.v1': 'settings',
    'pft.khatabook.v1': 'khatabook',
    'pft.networth.v1': 'networth',
    'pft.nw_activity.v1': 'nw_activity',
  }
}));

describe('Finance Store Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('useSalary', () => {
    it('calculates totals correctly', async () => {
      const { result } = renderHook(() => useSalary());
      
      // Wait for hydration (simulated)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

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
      const category = updatedCategories.find(c => c.id === categoryId);
      
      const total = category?.transactions.reduce((sum, t) => sum + t.amount, 0);
      expect(total).toBe(150);
    });
  });

  describe('useKhatabook', () => {
    it('manages people and entries correctly', async () => {
      const { result } = renderHook(() => useKhatabook());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.addPerson('John Doe');
      });

      const person = result.current.people.find(p => p.name === 'John Doe');
      expect(person).toBeDefined();

      act(() => {
        result.current.addEntry(person!.id, {
          note: 'Lent money',
          amount: 500,
          type: 'lent',
          date: '2026-08-15'
        });
      });

      const updatedPerson = result.current.people.find(p => p.name === 'John Doe');
      expect(updatedPerson?.entries.length).toBe(1);
      expect(updatedPerson?.entries[0].amount).toBe(500);
    });
  });

  describe('useNetWorth', () => {
    it('initializes default assets and updates values', async () => {
      const { result } = renderHook(() => useNetWorth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should have default assets
      expect(result.current.assets.length).toBeGreaterThan(0);
      
      const stocks = result.current.assets.find(a => a.type === 'Stocks');
      expect(stocks).toBeDefined();

      act(() => {
        result.current.addEntry(stocks!.id, {
          amount: 1000,
          date: '2026-08-15',
          note: 'Bought shares'
        });
      });

      const updatedStocks = result.current.assets.find(a => a.type === 'Stocks');
      expect(updatedStocks?.entries.length).toBe(1);
    });
  });
});
