import { useCallback, useEffect, useState } from "react";

export type Transaction = { id: string; name: string; amount: number; completed?: boolean };
export type Category = {
  id: string;
  name: string;
  collapsed?: boolean;
  transactions: Transaction[];
};
export type MonthData = { categories: Category[]; income?: number };
export type YearData = { months: Record<string, MonthData> }; // month key: "01".."12"
export type SalaryData = { years: Record<string, YearData> };

export type BillingCycle = "monthly" | "quarterly" | "semiannual" | "yearly";
export type Subscription = {
  id: string;
  name: string;
  price: number;
  cycle: BillingCycle;
  startDate?: string; // ISO date string YYYY-MM-DD
};

export type Settings = {
  currency: string;
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
  showWeeklyTotal?: boolean;
  showYearlyTotal?: boolean;
  nwColumns?: number;
  hideNWBalances?: boolean;
};


const uid = () => Math.random().toString(36).slice(2, 10);

const defaultMonth = (): MonthData => ({
  categories: [
    {
      id: uid(),
      name: "Housing",
      transactions: [
        { id: uid(), name: "Monthly Rent", amount: 1850 },
        { id: uid(), name: "Electric Utility", amount: 142.5 },
        { id: uid(), name: "Water & Sewage", amount: 157.5 },
      ],
    },
    {
      id: uid(),
      name: "Food & Dining",
      transactions: [
        { id: uid(), name: "Groceries", amount: 420 },
        { id: uid(), name: "Coffee", amount: 64 },
      ],
    },
    {
      id: uid(),
      name: "Transport",
      collapsed: true,
      transactions: [{ id: uid(), name: "Fuel", amount: 320 }],
    },
  ],
});

const emptyMonth = (): MonthData => ({ categories: [] });

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function usePersisted<T>(key: string, initial: () => T) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<T>(initial);
  useEffect(() => {
    setState(loadJSON<T>(key, initial()));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (hydrated) saveJSON(key, state);
  }, [key, state, hydrated]);
  return [state, setState, hydrated] as const;
}

const SALARY_KEY = "pft.salary.v1";
const SUBS_KEY = "pft.subs.v1";
const SETTINGS_KEY = "pft.settings.v1";
const KHATA_KEY = "pft.khatabook.v1";

export type LedgerEntry = {
  id: string;
  note: string;
  amount: number;
  /** "lent" = they owe you, "borrowed" = you owe them */
  type: "lent" | "borrowed";
  date: string;
};
export type Person = {
  id: string;
  name: string;
  collapsed?: boolean;
  entries: LedgerEntry[];
};

export type AssetEntry = {
  id: string;
  amount: number;
  date: string;
  note?: string;
  isPending?: boolean;
};

export type AssetType =
  | "PPF" | "EPF" | "EPS" | "NPS" | "Mutual Funds" | "Stocks" | "Foreign Stocks" 
  | "Gold" | "FD" | "RD" | "Savings" | "Cash" | "Crypto" | "Property" | "Other";

export type NetWorthAsset = {
  id: string;
  name: string;
  type: AssetType;
  currentValue: number;
  entries: AssetEntry[];
  recurringAmount?: number;
  recurringDay?: number;
  archived?: boolean;
};

export type NWActivity = {
  id: string;
  action: string;
  timestamp: string;
};

const NW_KEY = "pft.networth.v1";
const NW_ACTIVITY_KEY = "pft.nw_activity.v1";

export function useNetWorth() {
  const [assets, setAssets, hydrated] = usePersisted<NetWorthAsset[]>(NW_KEY, () => []);
  const [activity, setActivity] = usePersisted<NWActivity[]>(NW_ACTIVITY_KEY, () => []);

  const addActivity = (action: string) =>
    setActivity((prev) => [{ id: uid(), action, timestamp: new Date().toISOString() }, ...prev].slice(0, 50));

  const addAsset = (asset: Omit<NetWorthAsset, "id" | "entries" | "archived">) => {
    setAssets((prev) => [...prev, { ...asset, id: uid(), entries: [], archived: false }]);
    addActivity(`${asset.name} asset added`);
  };

  const updateAsset = (id: string, patch: Partial<NetWorthAsset>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    addActivity(`Asset ${patch.name ? patch.name : "details"} updated`);
  };

  const archiveAsset = (id: string) => {
    setAssets((prev) => prev.map(a => a.id === id ? { ...a, archived: true } : a));
    addActivity(`Asset archived`);
  }

  const addEntry = (aid: string, entry: Omit<AssetEntry, "id">) => {
    setAssets((prev) => prev.map((a) => 
      a.id === aid ? { ...a, entries: [...a.entries, { ...entry, id: uid() }] } : a
    ));
  }

  const confirmRecurring = (aid: string, eid: string, amount: number) => {
    setAssets((prev) => prev.map(a => {
        if (a.id !== aid) return a;
        const newEntries = a.entries.map(e => e.id === eid ? { ...e, isPending: false, amount } : e);
        return { ...a, entries: newEntries, currentValue: a.currentValue + amount };
    }));
    addActivity(`Monthly contribution confirmed`);
  }

  const skipRecurring = (aid: string, eid: string) => {
      setAssets((prev) => prev.map(a => {
          if (a.id !== aid) return a;
          const newEntries = a.entries.map(e => e.id === eid ? { ...e, isPending: false, amount: 0 } : e);
          return { ...a, entries: newEntries };
      }));
      addActivity(`Monthly contribution skipped`);
  }

  return { assets, activity, addAsset, updateAsset, addEntry, confirmRecurring, skipRecurring, archiveAsset, addActivity, hydrated };
}

/**
 * Checks for recurring assets and creates pending entries if needed at start of month
 */
export function useNetWorthRecurring(nw: ReturnType<typeof useNetWorth>) {
  useEffect(() => {
    if (!nw.hydrated || nw.assets.length === 0) return;

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    
    nw.assets.forEach(asset => {
      if (asset.recurringAmount && asset.recurringDay) {
        // Check if we already have an entry for this month
        const hasEntry = asset.entries.some(e => e.date.startsWith(monthKey));
        if (!hasEntry && now.getDate() >= asset.recurringDay) {
          nw.addEntry(asset.id, {
            amount: asset.recurringAmount,
            date: `${monthKey}-${String(asset.recurringDay).padStart(2, "0")}`,
            note: "Recurring contribution",
            isPending: true
          });
        }
      }
    });
  }, [nw.hydrated, nw.assets.length]); // Simple check on mount/asset count change
}


export const personBalance = (p: Person) =>
  p.entries.reduce((a, e) => a + (e.type === "lent" ? e.amount : -e.amount), 0);

export function useKhatabook() {
  const [people, setPeople, hydrated] = usePersisted<Person[]>(KHATA_KEY, () => [
    {
      id: uid(),
      name: "Alex Morgan",
      entries: [
        { id: uid(), note: "Dinner split", amount: 45, type: "lent", date: new Date().toISOString().slice(0, 10) },
        { id: uid(), note: "Concert ticket", amount: 120, type: "lent", date: new Date().toISOString().slice(0, 10) },
      ],
    },
    {
      id: uid(),
      name: "Priya Sharma",
      collapsed: true,
      entries: [
        { id: uid(), note: "Cab fare", amount: 30, type: "borrowed", date: new Date().toISOString().slice(0, 10) },
      ],
    },
  ]);

  const addPerson = (name: string) =>
    setPeople((prev) => [...prev, { id: uid(), name, entries: [] }]);
  const renamePerson = (id: string, name: string) =>
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  const deletePerson = (id: string) =>
    setPeople((prev) => prev.filter((p) => p.id !== id));
  const togglePerson = (id: string) =>
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, collapsed: !p.collapsed } : p)),
    );
  const addEntry = (pid: string, entry: Omit<LedgerEntry, "id">) =>
    setPeople((prev) =>
      prev.map((p) =>
        p.id === pid ? { ...p, entries: [...p.entries, { ...entry, id: uid() }] } : p,
      ),
    );
  const updateEntry = (pid: string, eid: string, patch: Partial<LedgerEntry>) =>
    setPeople((prev) =>
      prev.map((p) =>
        p.id === pid
          ? { ...p, entries: p.entries.map((e) => (e.id === eid ? { ...e, ...patch } : e)) }
          : p,
      ),
    );
  const deleteEntry = (pid: string, eid: string) =>
    setPeople((prev) =>
      prev.map((p) =>
        p.id === pid ? { ...p, entries: p.entries.filter((e) => e.id !== eid) } : p,
      ),
    );

  return {
    people,
    hydrated,
    addPerson,
    renamePerson,
    deletePerson,
    togglePerson,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}

export function useSalary() {
  const now = new Date();
  const initialYear = String(now.getFullYear());
  const initialMonth = String(now.getMonth() + 1).padStart(2, "0");

  const [data, setData, hydrated] = usePersisted<SalaryData>(SALARY_KEY, () => ({
    years: { [initialYear]: { months: { [initialMonth]: defaultMonth() } } },
  }));
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  // Auto-transition to current month
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      const y = String(d.getFullYear());
      const m = String(d.getMonth() + 1).padStart(2, "0");
      setYear((cy) => (cy === y ? cy : y));
      setMonth((cm) => (cm === m ? cm : m));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const years = Object.keys(data.years).sort();
  const currentYear = data.years[year];
  const months = currentYear ? Object.keys(currentYear.months).sort() : [];
  const currentMonth: MonthData =
    currentYear?.months[month] ?? emptyMonth();

  const ensureYearMonth = useCallback(
    (y: string, m: string, seed?: MonthData) => {
      setData((prev) => {
        const next: SalaryData = { years: { ...prev.years } };
        const yr = next.years[y] ?? { months: {} };
        if (!yr.months[m]) yr.months[m] = seed ?? emptyMonth();
        next.years[y] = { ...yr, months: { ...yr.months } };
        return next;
      });
    },
    [setData],
  );

  const updateMonth = useCallback(
    (updater: (m: MonthData) => MonthData) => {
      setData((prev) => {
        const yr = prev.years[year] ?? { months: {} };
        const cur = yr.months[month] ?? emptyMonth();
        const updated = updater(cur);
        
        // Apply persistent collapse state
        const categoriesWithPersistence = updated.categories.map(c => {
          const stored = localStorage.getItem(`cat_collapsed_${c.id}`);
          if (stored === "true") return { ...c, collapsed: true };
          return c;
        });

        return {
          years: {
            ...prev.years,
            [year]: {
              months: { 
                ...yr.months, 
                [month]: { ...updated, categories: categoriesWithPersistence } 
              },
            },
          },
        };
      });
    },
    [setData, year, month],
  );

  const addCategory = (name: string) =>
    updateMonth((m) => ({
      ...m,
      categories: [...m.categories, { id: uid(), name, transactions: [] }],
    }));

  const renameCategory = (cid: string, name: string) =>
    updateMonth((m) => ({
      ...m,
      categories: m.categories.map((c) => (c.id === cid ? { ...c, name } : c)),
    }));

  const deleteCategory = (cid: string) =>
    updateMonth((m) => ({
      ...m,
      categories: m.categories.filter((c) => c.id !== cid),
    }));

  const toggleCategory = (cid: string) =>
    updateMonth((m) => {
      const cat = m.categories.find((c) => c.id === cid);
      if (cat) {
        const key = `cat_collapsed_${cid}`;
        if (cat.collapsed) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, "true");
        }
      }
      return {
        ...m,
        categories: m.categories.map((c) =>
          c.id === cid ? { ...c, collapsed: !c.collapsed } : c,
        ),
      };
    });

  const addTransaction = (cid: string, name: string, amount: number) =>
    updateMonth((m) => ({
      ...m,
      categories: m.categories.map((c) =>
        c.id === cid
          ? {
              ...c,
              transactions: [
                ...c.transactions,
                { id: uid(), name, amount },
              ],
            }
          : c,
      ),
    }));

  const updateTransaction = (
    cid: string,
    tid: string,
    patch: Partial<Transaction>,
  ) =>
    updateMonth((m) => ({
      ...m,
      categories: m.categories.map((c) =>
        c.id === cid
          ? {
              ...c,
              transactions: c.transactions.map((t) =>
                t.id === tid ? { ...t, ...patch } : t,
              ),
            }
          : c,
      ),
    }));

  const deleteTransaction = (cid: string, tid: string) =>
    updateMonth((m) => ({
      ...m,
      categories: m.categories.map((c) =>
        c.id === cid
          ? { ...c, transactions: c.transactions.filter((t) => t.id !== tid) }
          : c,
      ),
    }));

  const addYear = (y: string) => {
    setData((prev) =>
      prev.years[y] ? prev : { years: { ...prev.years, [y]: { months: {} } } },
    );
    setYear(y);
  };

  const importMonthTemplate = (fromY: string, fromM: string) => {
    const src = data.years[fromY]?.months[fromM];
    if (!src) return;
    // Deep clone with new ids
    const cloned: MonthData = {
      income: src.income,
      categories: src.categories.map((c) => ({
        ...c,
        id: uid(),
        transactions: c.transactions.map((t) => ({ ...t, id: uid() })),
      })),
    };
    ensureYearMonth(year, month, cloned);
    updateMonth(() => cloned);
  };

  const setIncome = (value: number | undefined) =>
    updateMonth((m) => ({ ...m, income: value }));

  return {
    hydrated,
    year,
    month,
    setYear,
    setMonth,
    years,
    months,
    data,
    currentMonth,
    ensureYearMonth,
    addCategory,
    renameCategory,
    deleteCategory,
    toggleCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addYear,
    importMonthTemplate,
    setIncome,
  };
}

export function useSubscriptions() {
  const [subs, setSubs, hydrated] = usePersisted<Subscription[]>(SUBS_KEY, () => [
    { id: uid(), name: "Netflix", price: 15.99, cycle: "monthly" },
    { id: uid(), name: "Spotify", price: 9.99, cycle: "monthly" },
    { id: uid(), name: "iCloud+", price: 2.99, cycle: "monthly" },
    { id: uid(), name: "Adobe Creative Cloud", price: 599.88, cycle: "yearly" },
    { id: uid(), name: "Gym", price: 240, cycle: "quarterly" },
  ]);

  const add = (s: Omit<Subscription, "id">) =>
    setSubs((prev) => [...prev, { ...s, id: uid() }]);
  const update = (id: string, patch: Partial<Subscription>) =>
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) =>
    setSubs((prev) => prev.filter((s) => s.id !== id));

  return { subs, add, update, remove, hydrated };
}

export const monthlyEquivalent = (s: Subscription) => {
  switch (s.cycle) {
    case "monthly":
      return s.price;
    case "quarterly":
      return s.price / 3;
    case "semiannual":
      return s.price / 6;
    case "yearly":
      return s.price / 12;
  }
};

const defaultSettings: Settings = {
  currency: "₹",
  theme: "light",
  language: "en",
  notifications: true,
  showWeeklyTotal: true,
  showYearlyTotal: true,
  nwColumns: 2,
};


export function useSettings() {
  const [settings, setSettings, hydrated] = usePersisted<Settings>(
    SETTINGS_KEY,
    () => defaultSettings,
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  return { settings, setSettings, hydrated };
}

export function formatMoney(amount: number, currency = "₹") {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}${currency}${abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];