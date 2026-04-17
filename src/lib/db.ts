import type { StoreName } from "@/types";

const DB_NAME = "BudgetProDB";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("incomes")) {
        const incomeStore = db.createObjectStore("incomes", {
          keyPath: "id",
          autoIncrement: true,
        });
        incomeStore.createIndex("date", "date", { unique: false });
        incomeStore.createIndex("month", "month", { unique: false });
      }

      if (!db.objectStoreNames.contains("allocations")) {
        const allocStore = db.createObjectStore("allocations", {
          keyPath: "id",
          autoIncrement: true,
        });
        allocStore.createIndex("incomeId", "incomeId", { unique: false });
        allocStore.createIndex("category", "category", { unique: false });
        allocStore.createIndex("month", "month", { unique: false });
      }

      if (!db.objectStoreNames.contains("expenses")) {
        const expStore = db.createObjectStore("expenses", {
          keyPath: "id",
          autoIncrement: true,
        });
        expStore.createIndex("category", "category", { unique: false });
        expStore.createIndex("date", "date", { unique: false });
        expStore.createIndex("month", "month", { unique: false });
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
  });
}

export async function addRecord<T>(storeName: StoreName, data: T): Promise<IDBValidKey> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateRecord<T>(storeName: StoreName, data: T): Promise<IDBValidKey> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecord(storeName: StoreName, id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllRecords<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const store = tx.objectStore("settings");
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result as { key: string; value: T } | undefined;
      resolve(result ? result.value : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function setSetting<T>(key: string, value: T): Promise<IDBValidKey> {
  return updateRecord("settings", { key, value });
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
