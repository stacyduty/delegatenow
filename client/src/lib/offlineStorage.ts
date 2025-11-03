const DB_NAME = 'deleg8te-offline';
const DB_VERSION = 1;

export interface OfflineStore {
  name: string;
  keyPath: string;
}

const stores: OfflineStore[] = [
  { name: 'tasks', keyPath: 'id' },
  { name: 'teamMembers', keyPath: 'id' },
  { name: 'analytics', keyPath: 'id' },
  { name: 'voiceHistory', keyPath: 'id' },
  { name: 'notifications', keyPath: 'id' },
  { name: 'user', keyPath: 'id' },
  { name: 'pendingMutations', keyPath: 'id' },
  { name: 'voiceQueue', keyPath: 'id' },
];

let dbInstance: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      stores.forEach(({ name, keyPath }) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath });
        }
      });
    };
  });
}

export async function saveToStore<T>(storeName: string, data: T | T[]): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  const items = Array.isArray(data) ? data : [data];

  for (const item of items) {
    store.put(item);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getFromStore<T>(storeName: string, key?: string): Promise<T | T[] | null> {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    if (key) {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    } else {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    }
  });
}

export async function deleteFromStore(storeName: string, key: string): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export interface PendingMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data?: any;
  timestamp: number;
}

export async function queueMutation(mutation: Omit<PendingMutation, 'id' | 'timestamp'>): Promise<void> {
  const pendingMutation: PendingMutation = {
    id: crypto.randomUUID(),
    ...mutation,
    timestamp: Date.now(),
  };

  await saveToStore('pendingMutations', pendingMutation);

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await (registration as any).sync.register('sync-mutations');
        console.log('Background sync registered for mutations');
      }
    } catch (err) {
      console.log('Background sync registration failed (may not be supported):', err);
    }
  }
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  return (await getFromStore<PendingMutation>('pendingMutations')) as PendingMutation[] || [];
}

export async function removePendingMutation(id: string): Promise<void> {
  await deleteFromStore('pendingMutations', id);
}
