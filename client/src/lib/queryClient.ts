import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { saveToStore, getFromStore } from "./offlineStorage";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getStoreNameFromEndpoint(endpoint: string): string | null {
  if (endpoint.includes('/api/tasks')) return 'tasks';
  if (endpoint.includes('/api/team-members')) return 'teamMembers';
  if (endpoint.includes('/api/voice-history')) return 'voiceHistory';
  if (endpoint.includes('/api/notifications')) return 'notifications';
  if (endpoint.includes('/api/user')) return 'user';
  if (endpoint.includes('/api/dashboard/stats')) return 'analytics';
  return null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const endpoint = queryKey.join("/") as string;
    const storeName = getStoreNameFromEndpoint(endpoint);

    try {
      const res = await fetch(endpoint, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();

      if (storeName && navigator.onLine) {
        await saveToStore(storeName, data);
      }

      return data;
    } catch (error) {
      if (!navigator.onLine && storeName) {
        const cachedData = await getFromStore(storeName);
        if (cachedData) {
          console.log(`Using cached data for ${endpoint}`);
          return cachedData;
        }
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
