import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { getPendingMutations, type PendingMutation } from '@/lib/offlineStorage';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const isOnline = useOfflineStatus();

  const { data: pendingMutations = [] } = useQuery<PendingMutation[]>({
    queryKey: ['pendingMutations'],
    queryFn: async () => await getPendingMutations(),
    refetchInterval: 2000,
  });

  const hasPendingChanges = pendingMutations.length > 0;

  if (isOnline && !hasPendingChanges) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 flex justify-center p-2">
      <Badge
        variant={isOnline ? "default" : "destructive"}
        className={cn(
          "gap-2 shadow-lg",
          isOnline && hasPendingChanges && "bg-chart-4 hover:bg-chart-4"
        )}
        data-testid="badge-offline-status"
      >
        {!isOnline ? (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Offline Mode</span>
          </>
        ) : hasPendingChanges ? (
          <>
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Syncing {pendingMutations.length} change{pendingMutations.length !== 1 ? 's' : ''}...</span>
          </>
        ) : (
          <>
            <Wifi className="h-3 w-3" />
            <span>Connected</span>
          </>
        )}
      </Badge>
    </div>
  );
}
