import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as db from './db';
import { useSalary, useKhatabook, useNetWorth } from './finance-store';

// Mock the DB module
vi.mock('./db', async () => {
  const actual = await vi.importActual<typeof import('./db')>('./db');
  return {
    ...actual,
    getDBItem: vi.fn(),
    setDBItem: vi.fn(),
    migrateFromLocalStorage: vi.fn().mockResolvedValue(undefined),
  };
});

describe('Finance Store Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getDBItem).mockResolvedValue(null);
    vi.mocked(db.setDBItem).mockResolvedValue(undefined);
  });

  const waitForHydration = async (result: { current: { hydrated: boolean } }) => {
    // If already hydrated, return immediately
    if (result.current.hydrated) return;

    // Use a robust polling mechanism that triggers re-renders if needed
    const start = Date.now();
    while (!result.current.hydrated && Date.now() - start < 2000) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
    }
    
    if (!result.current.hydrated) {
      console.log('Final state before timeout:', result.current);
      throw new Error('Hydration timed out');
    }
  };

  describe('useSalary', () => {
    it('calculates totals correctly', async () => {
      const { result } = renderHook(() => useSalary());
      await waitForHydration(result);

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
      await waitForHydration(result);

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
      await waitForHydration(result);

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

      const updatedStocks = result.current.assets.find(a => a.id === stocks!.id);
      expect(updatedStocks?.entries.length).toBe(1);
    });
  });
});


