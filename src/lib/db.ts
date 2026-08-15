/**
 * Lightweight IndexedDB wrapper for local-first storage.
 */

const DB_NAME = "LedgerDB";
const DB_VERSION = 1;
const STORES = ["salary", "subscriptions", "khatabook", "networth", "nw_activity", "settings", "metadata", "auth", "ui_settings"];

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

class WriteQueue {
  private queue: Promise<any> = Promise.resolve();

  enqueue<T>(operation: () => Promise<T>): Promise<T> {
    this.queue = this.queue.then(operation, operation);
    return this.queue;
  }
}

const writeQueue = new WriteQueue();

export async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      dbPromise = null;
      resolve(dbInstance);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      STORES.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      });
    };
  });

  return dbPromise;
}

export async function getDBItem<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T || null);
  });
}

export async function setDBItem<T>(storeName: string, key: string, value: T): Promise<void> {
  return writeQueue.enqueue(async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
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
  "pft.nw_activity.v1": "nw_activity"
};

/**
 * Migrates data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage() {
  const migrated = localStorage.getItem("pft.indexeddb.migrated");
  if (migrated === "true") return;

  for (const [lsKey, storeName] of Object.entries(STORE_MAP)) {
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        await setDBItem(storeName, "data", data);
      } catch (e) {
        console.error(`Failed to migrate ${lsKey}`, e);
      }
    }
  }

  localStorage.setItem("pft.indexeddb.migrated", "true");
}
