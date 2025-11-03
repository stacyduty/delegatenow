import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queueMutation } from '@/lib/offlineStorage';
import { isOnline } from '@/lib/offlineSync';

interface OfflineMutationOptions {
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  invalidateQueries?: string[];
}

export function useOfflineMutation<TData = unknown, TVariables = unknown>(
  options: OfflineMutationOptions
) {
  const queryClient = useQueryClient();
  const { endpoint, method, invalidateQueries = [] } = options;

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      if (!isOnline()) {
        await queueMutation({
          type: method === 'POST' ? 'create' : method === 'PATCH' ? 'update' : 'delete',
          endpoint,
          data: variables,
        });

        return null;
      }

      const response = await apiRequest(method, endpoint, variables);
      return response.json() as Promise<TData>;
    },
    onSuccess: () => {
      invalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    },
  });
}
