import { apiRequest } from './queryClient';
import { getPendingMutations, removePendingMutation, type PendingMutation } from './offlineStorage';

export function isOnline(): boolean {
  return navigator.onLine;
}

export async function syncPendingMutations(): Promise<void> {
  if (!isOnline()) {
    console.log('Offline - skipping sync');
    return;
  }

  const mutations = await getPendingMutations();
  
  if (mutations.length === 0) {
    console.log('No pending mutations to sync');
    return;
  }

  console.log(`Syncing ${mutations.length} pending mutations...`);

  const sortedMutations = mutations.sort((a, b) => a.timestamp - b.timestamp);

  for (const mutation of sortedMutations) {
    try {
      await executeMutation(mutation);
      await removePendingMutation(mutation.id);
      console.log(`Synced mutation: ${mutation.type} ${mutation.endpoint}`);
    } catch (error) {
      console.error(`Failed to sync mutation: ${mutation.type} ${mutation.endpoint}`, error);
    }
  }
}

async function executeMutation(mutation: PendingMutation): Promise<void> {
  const method = mutation.type === 'create' ? 'POST' : 
                 mutation.type === 'update' ? 'PATCH' : 
                 'DELETE';

  await apiRequest(method, mutation.endpoint, mutation.data);
}

export function setupOnlineListener(callback: () => void): () => void {
  const handler = () => {
    console.log('Connection restored - triggering sync');
    callback();
  };

  window.addEventListener('online', handler);

  return () => window.removeEventListener('online', handler);
}

export function setupOfflineListener(callback: () => void): () => void {
  const handler = () => {
    console.log('Connection lost');
    callback();
  };

  window.addEventListener('offline', handler);

  return () => window.removeEventListener('offline', handler);
}
