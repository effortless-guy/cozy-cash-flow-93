import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { getDBItem, setDBItem, migrateFromLocalStorage, STORE_MAP } from "./db";

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
  customIcon?: string;
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
  appLockEnabled?: boolean;
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

function usePersisted<T>(key: string, initial: () => T) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<T>(initial);
  const storeName = STORE_MAP[key];
  const isInitialMount = useRef(true);

  useEffect(() => {
    async function init() {
      if (typeof window === "undefined") return;
      
      await migrateFromLocalStorage();
      const val = await getDBItem<T>(storeName, "data");
      
      if (val !== null) {
        setState(val);
      } else {
        const initVal = initial();
        setState(initVal);
        // Save initial values to DB if it's the first time
        await setDBItem(storeName, "data", initVal);
      }
      setHydrated(true);
    }
    init();
  }, [storeName, initial]);

  useEffect(() => {
    if (hydrated && !isInitialMount.current) {
      setDBItem(storeName, "data", state).catch(console.error);
      return;
    }
    if (hydrated) {
      isInitialMount.current = false;
    }
  }, [state, hydrated, storeName]);

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
  | "Gold" | "FD" | "RD" | "Emergency Fund" | "Savings" | "Cash" | "Crypto" | "Property" | "Other";

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

const DEFAULT_ASSETS: Omit<NetWorthAsset, "id" | "entries" | "archived">[] = [
  { name: "PPF", type: "PPF", currentValue: 0 },
  { name: "EPF", type: "EPF", currentValue: 0 },
  { name: "NPS", type: "NPS", currentValue: 0 },
  { name: "Stocks", type: "Stocks", currentValue: 0 },
  { name: "Mutual Funds", type: "Mutual Funds", currentValue: 0 },
  { name: "Foreign Stocks", type: "Foreign Stocks", currentValue: 0 },
  { name: "Gold", type: "Gold", currentValue: 0 },
  { name: "FD", type: "FD", currentValue: 0 },
  { name: "RD", type: "RD", currentValue: 0 },
  { name: "Emergency Fund", type: "Emergency Fund", currentValue: 0 },
  { name: "Savings Account", type: "Savings", currentValue: 0 },
  { name: "Cash", type: "Cash", currentValue: 0 },
  { name: "Crypto", type: "Crypto", currentValue: 0 },
  { name: "Property", type: "Property", currentValue: 0 },
  { name: "Other", type: "Other", currentValue: 0 },
];

export function useNetWorth() {
  const [assets, setAssets, hydrated] = usePersisted<NetWorthAsset[]>(NW_KEY, () => []);
  const [activity, setActivity] = usePersisted<NWActivity[]>(NW_ACTIVITY_KEY, () => []);

  // Initialize default assets for new users or add missing ones for existing users
  useEffect(() => {
    if (hydrated) {
      setAssets((prev) => {
        const existingNames = new Set(prev.map(a => a.name));
        const missing = DEFAULT_ASSETS.filter(d => !existingNames.has(d.name));
        if (missing.length > 0) {
          return [...prev, ...missing.map(m => ({ ...m, id: uid(), entries: [], archived: false }))];
        }
        return prev;
      });
    }
  }, [hydrated, setAssets]);

  const addActivity = (action: string) =>
    setActivity((prev) => [{ id: uid(), action, timestamp: new Date().toISOString() }, ...prev].slice(0, 50));

  const addAsset = (asset: Omit<NetWorthAsset, "id" | "entries" | "archived">) => {
    setAssets((prev) => {
      const existing = prev.find(a => a.name === asset.name);
      if (existing) {
        return prev.map(a => a.id === existing.id ? { ...a, archived: false, currentValue: a.currentValue + asset.currentValue } : a);
      }
      return [...prev, { ...asset, id: uid(), entries: [], archived: false }];
    });
    addActivity(`${asset.name} asset updated or added`);
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

  const deleteEntry = (aid: string, eid: string) => {
    setAssets((prev) => prev.map((a) => 
      a.id === aid ? { ...a, entries: a.entries.filter(e => e.id !== eid) } : a
    ));
    addActivity(`History entry deleted`);
  };

  const updateEntry = (aid: string, eid: string, patch: Partial<AssetEntry>) => {
    setAssets((prev) => prev.map((a) => 
      a.id === aid ? { ...a, entries: a.entries.map(e => e.id === eid ? { ...e, ...patch } : e) } : a
    ));
    addActivity(`History entry updated`);
  };

  return { assets, activity, addAsset, updateAsset, addEntry, deleteEntry, updateEntry, confirmRecurring, skipRecurring, archiveAsset, addActivity, hydrated };
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

  const setPeopleState = (next: Person[] | ((prev: Person[]) => Person[])) => {
    setPeople(next);
  };

  return {
    people,
    hydrated,
    addPerson,
    renamePerson,
    deletePerson,
    setPeopleState,
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
  const currentMonth: MonthData = useMemo(() => {
    return currentYear?.months[month] ?? emptyMonth();
  }, [currentYear, month]);

  const ensureYearMonth = useCallback(
    (y: string, m: string, seed?: MonthData) => {
      setData((prev) => {
        if (prev.years[y]?.months[m]) return prev;
        const next: SalaryData = { years: { ...prev.years } };
        const yr = next.years[y] ?? { months: {} };
        yr.months[m] = seed ?? emptyMonth();
        next.years[y] = { ...yr, months: { ...yr.months } };
        return next;
      });
    },
    [setData],
  );

  const updateMonth = useCallback(
    (updater: (m: MonthData) => MonthData) => {
      setData((prev) => {
        const yr = prev.years[year];
        if (!yr) return prev;
        const cur = yr.months[month] ?? emptyMonth();
        const updated = updater(cur);
        
        return {
          years: {
            ...prev.years,
            [year]: {
              months: { 
                ...yr.months, 
                [month]: updated
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

  const setMonthData = (next: MonthData | ((prev: MonthData) => MonthData)) => {
    updateMonth(typeof next === 'function' ? next : () => next);
  };


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

export function useDataManagement() {
  const exportData = async () => {
    const data = {
      salary: await getDBItem(STORE_MAP[SALARY_KEY], "data"),
      subscriptions: await getDBItem(STORE_MAP[SUBS_KEY], "data"),
      khatabook: await getDBItem(STORE_MAP[KHATA_KEY], "data"),
      networth: await getDBItem(STORE_MAP[NW_KEY], "data"),
      nw_activity: await getDBItem(STORE_MAP[NW_ACTIVITY_KEY], "data"),
      settings: await getDBItem(STORE_MAP[SETTINGS_KEY], "data"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (data.salary) await setDBItem(STORE_MAP[SALARY_KEY], "data", data.salary);
      if (data.subscriptions) await setDBItem(STORE_MAP[SUBS_KEY], "data", data.subscriptions);
      if (data.khatabook) await setDBItem(STORE_MAP[KHATA_KEY], "data", data.khatabook);
      if (data.networth) await setDBItem(STORE_MAP[NW_KEY], "data", data.networth);
      if (data.nw_activity) await setDBItem(STORE_MAP[NW_ACTIVITY_KEY], "data", data.nw_activity);
      if (data.settings) await setDBItem(STORE_MAP[SETTINGS_KEY], "data", data.settings);
      location.reload();
    } catch (e) {
      alert("Invalid backup file");
    }
  };

  return { exportData, importData };
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