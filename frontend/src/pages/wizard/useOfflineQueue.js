import { useCallback, useEffect, useState } from 'react';
import { pendingCount, flushQueue } from '@/lib/offlineQueue';

// Watches network state, tracks queued-report count, and auto-flushes on reconnect.
export default function useOfflineQueue(onFlush) {
  const [online, setOnline] = useState(navigator.onLine);
  const [queued, setQueued] = useState(0);

  const refreshQueued = useCallback(() => {
    pendingCount().then(setQueued).catch((err) => console.error('pendingCount failed:', err));
  }, []);

  useEffect(() => {
    const on = async () => {
      setOnline(true);
      try {
        const r = await flushQueue();
        if (onFlush && r.sent > 0) onFlush(r);
      } catch (err) {
        console.error('flushQueue failed:', err);
      }
      refreshQueued();
    };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    refreshQueued();
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [onFlush, refreshQueued]);

  return { online, queued, setQueued, refreshQueued };
}
