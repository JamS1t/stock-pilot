export const COUNTER_DB_NAME = "stockpilot_counter_ai";
export const COUNTER_DB_VERSION = 1;

const STORE_NAMES = [
  "products",
  "categories",
  "customers",
  "sales",
  "sale_items",
  "utang_entries",
  "utang_payments",
  "stock_movements",
  "cash_sessions",
  "cash_session_entries",
  "supplier_receipts",
  "sync_queue",
  "device_metadata",
];

let dbPromise: Promise<IDBDatabase> | null = null;

export function openCounterDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(COUNTER_DB_NAME, COUNTER_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      for (const storeName of STORE_NAMES) {
        if (!db.objectStoreNames.contains(storeName)) {
          const keyPath = storeName === "device_metadata" ? "key" : "local_id";
          const store = db.createObjectStore(storeName, { keyPath });

          if (storeName === "sync_queue") {
            store.createIndex("status", "status", { unique: false });
            store.createIndex("created_at", "created_at", { unique: false });
            store.createIndex("client_mutation_id", "client_mutation_id", {
              unique: true,
            });
          }
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function readAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openCounterDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function putInStore<T>(storeName: string, value: T): Promise<void> {
  const db = await openCounterDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFromStore<T>(
  storeName: string,
  key: IDBValidKey
): Promise<T | null> {
  const db = await openCounterDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(key);

    request.onsuccess = () => resolve((request.result as T) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromStore(
  storeName: string,
  key: IDBValidKey
): Promise<void> {
  const db = await openCounterDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
