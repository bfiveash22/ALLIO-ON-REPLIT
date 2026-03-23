import { QueryClient, QueryFunction } from "@tanstack/react-query";

const ADMIN_API_BASES = ["/api/agents", "/api/sentinel"];

function isAdminEndpoint(url: string): boolean {
  return ADMIN_API_BASES.some(
    (base) => url === base || url.startsWith(base + "/"),
  );
}

function getAuthHeaders(url: string): Record<string, string> {
  if (isAdminEndpoint(url)) {
    const apiKey = import.meta.env.VITE_ALLIO_API_KEY;
    if (apiKey) {
      return { Authorization: `Bearer ${apiKey}` };
    }
  }
  return {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(url),
  };
  if (data) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
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
      const url = queryKey.join("/") as string;
      const res = await fetch(url, {
        credentials: "include",
        headers: getAuthHeaders(url),
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
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
