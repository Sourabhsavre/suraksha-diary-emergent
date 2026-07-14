import { openDB } from 'idb';
import { api } from './api';

const DB_NAME = 'suraksha-queue';
const STORE = 'pending';

const getDb = () => openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    }
  },
});

export async function queueReport(payload) {
  const db = await getDb();
  await db.add(STORE, { payload, queued_at: new Date().toISOString() });
}

export async function pendingCount() {
  const db = await getDb();
  return db.count(STORE);
}

export async function flushQueue() {
  if (!navigator.onLine) return { sent: 0, failed: 0 };
  const db = await getDb();
  const all = await db.getAll(STORE);
  let sent = 0, failed = 0;
  for (const item of all) {
    try {
      await api.post('/incidents', item.payload);
      await db.delete(STORE, item.id);
      sent += 1;
    } catch (e) {
      failed += 1;
    }
  }
  return { sent, failed };
}

export function initAutoFlush(onFlush) {
  const handler = async () => {
    const r = await flushQueue();
    if (onFlush) onFlush(r);
  };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
