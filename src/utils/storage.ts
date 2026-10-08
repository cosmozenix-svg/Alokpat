/**
 * Safe client storage manager with IndexedDB fallback and QuotaExceededError prevention.
 */

const DB_NAME = 'alokpat_storage_db';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore idb errors
  }
}

/**
 * Safely saves data to localStorage without throwing QuotaExceededError,
 * and mirrors data to IndexedDB for large capacity.
 */
export function safeSetStorage<T>(key: string, data: T): void {
  // Always mirror to IndexedDB asynchronously
  idbSet(key, data).catch(() => {});

  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error: any) {
    // If quota exceeded, try to clean up or compress
    console.warn(`[SafeStorage] localStorage quota exceeded for key "${key}". Preserved in IndexedDB.`, error?.message);
    try {
      // If it's an array of items (like posts), we can try saving the latest items in localStorage
      if (Array.isArray(data) && data.length > 10) {
        const trimmed = data.slice(0, 10);
        localStorage.setItem(key, JSON.stringify(trimmed));
      }
    } catch {
      // Safely ignore if second attempt fails; IndexedDB already has full data
    }
  }
}

/**
 * Safely reads data from localStorage
 */
export function safeGetStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn(`[SafeStorage] Failed to parse localStorage item for "${key}"`, e);
  }
  return fallback;
}
