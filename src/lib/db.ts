import Dexie, { type Table } from "dexie";

/**
 * MoneyStory Database using Dexie.js
 * Provides versioning, migration, and robust IndexedDB management.
 */
export class MoneyStoryDatabase extends Dexie {
  salary!: Table<{ id: string; data: any }, string>;
  subscriptions!: Table<{ id: string; data: any }, string>;
  khatabook!: Table<{ id: string; data: any }, string>;
  networth!: Table<{ id: string; data: any }, string>;
  nw_activity!: Table<{ id: string; data: any }, string>;
  settings!: Table<{ id: string; data: any }, string>;
  metadata!: Table<{ id: string; data: any }, string>;
  auth!: Table<{ id: string; data: any }, string>;
  ui_settings!: Table<{ id: string; data: any }, string>;

  constructor() {
    super("MoneyStoryDB");
    
    // Define schema
    this.version(1).stores({
      salary: "id",
      subscriptions: "id",
      khatabook: "id",
      networth: "id",
      nw_activity: "id",
      settings: "id",
      metadata: "id",
      auth: "id",
      ui_settings: "id",
    });
  }
}

export const db = new MoneyStoryDatabase();

/**
 * Legacy support wrapper for current store implementation
 */
export async function getDBItem<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const table = (db as any)[storeName] as Table<{ id: string; data: T }, string>;
    if (!table) return null;
    const item = await table.get(key);
    return item ? item.data : null;
  } catch (error) {
    console.error(`Dexie get error for ${storeName}/${key}:`, error);
    return null;
  }
}

export async function setDBItem<T>(storeName: string, key: string, value: T): Promise<void> {
  try {
    const table = (db as any)[storeName] as Table<{ id: string; data: T }, string>;
    if (!table) return;
    await table.put({ id: key, data: value });
  } catch (error) {
    console.error(`Dexie put error for ${storeName}/${key}:`, error);
    throw error;
  }
}

export async function clearStore(storeName: string): Promise<void> {
  const table = (db as any)[storeName] as Table<any, any>;
  if (table) {
    await table.clear();
  }
}

/**
 * Maps legacy localStorage keys to IndexedDB stores
 */
export const STORE_MAP: Record<string, string> = {
  "pft.salary.v1": "salary",
  "pft.subs.v1": "subscriptions",
  "pft.settings.v1": "settings",
  "pft.khatabook.v1": "khatabook",
  "pft.networth.v1": "networth",
  "pft.nw_activity.v1": "nw_activity",
  "pft.ui_settings.v1": "ui_settings"
};

/**
 * Migrates data from localStorage to IndexedDB with validation
 */
export async function migrateFromLocalStorage() {
  const MIGRATION_KEY = "moneystory.indexeddb.migrated.v2"; // Bumped version for Dexie
  const migrated = localStorage.getItem(MIGRATION_KEY);
  if (migrated === "true") return;

  console.log("Starting migration from localStorage to Dexie...");

  for (const [lsKey, storeName] of Object.entries(STORE_MAP)) {
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        // Simple validation: ensure it's an object or array if not empty
        if (data && typeof data === 'object') {
          await setDBItem(storeName, "data", data);
          console.log(`Successfully migrated ${lsKey} to ${storeName}`);
        }
      } catch (e) {
        console.error(`Failed to migrate ${lsKey}`, e);
      }
    }
  }

  // Also check if there's data in the OLD IndexedDB (LedgerDB) 
  // and migrate it to MoneyStoryDB if needed.
  // For now, we prioritize localStorage as the requested migration path.

  localStorage.setItem(MIGRATION_KEY, "true");
}

/**
 * Requests persistent storage from the browser
 */
export async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`Storage is ${isPersisted ? "persistent" : "not persistent (best-effort)"}`);
    return isPersisted;
  }
  return false;
}
