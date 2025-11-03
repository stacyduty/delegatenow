import { useState, useEffect } from 'react';
import { setupOnlineListener, setupOfflineListener, isOnline } from '@/lib/offlineSync';

export function useOfflineStatus() {
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const cleanupOnline = setupOnlineListener(() => setOnline(true));
    const cleanupOffline = setupOfflineListener(() => setOnline(false));

    return () => {
      cleanupOnline();
      cleanupOffline();
    };
  }, []);

  return online;
}
