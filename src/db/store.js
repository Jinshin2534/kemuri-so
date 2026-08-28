// 登録レコードの保存先。写真つきレコードを持つので localStorage では容量が足りない。
// ここは IndexedDB を触るだけの層で、判定のロジックは一切持たない。

import { validateRecord } from '../lib/record.js';

const DB_NAME = 'kemuri-so';
const DB_VERSION = 1;
const STORE = 'records';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        let result;
        try {
          result = fn(store);
        } catch (e) {
          reject(e);
          return;
        }
        t.oncomplete = () => resolve(result && result.__req ? result.__req.result : result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

export function allRecords() {
  return tx('readonly', (store) => ({ __req: store.index('createdAt').getAll() }));
}

export function countRecords() {
  return tx('readonly', (store) => ({ __req: store.count() }));
}

export function putRecord(record) {
  const v = validateRecord(record);
  if (!v.ok) return Promise.reject(new Error(`保存できないレコードです: ${v.errors.join(' / ')}`));
  return tx('readwrite', (store) => {
    store.put(record);
  });
}

export function putRecords(records) {
  for (const r of records) {
    const v = validateRecord(r);
    if (!v.ok) return Promise.reject(new Error(`保存できないレコードです: ${v.errors.join(' / ')}`));
  }
  return tx('readwrite', (store) => {
    for (const r of records) store.put(r);
  });
}

export function deleteRecord(id) {
  return tx('readwrite', (store) => {
    store.delete(id);
  });
}

export function clearRecords() {
  return tx('readwrite', (store) => {
    store.clear();
  });
}
