import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient configuration optimized for optimistic UI
 * 
 * Key settings:
 * - Aggressive stale time: Data stays fresh longer, reducing refetches
 * - Short gc time: Freed memory faster for inactive queries
 * - Retry disabled for mutations: Optimistic updates handle errors via rollback
 * - Window focus refetch disabled: Prevents unexpected data overwriting
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cached data removed after 10 minutes of inactivity
        gcTime: 10 * 60 * 1000,
        // Don't refetch on window focus - prevents optimistic updates being overwritten
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect by default
        refetchOnReconnect: false,
        // Retry failed queries twice with exponential backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
      mutations: {
        // Don't retry mutations - let optimistic rollback handle failures
        retry: false,
        // Network mode ensures mutations run even offline (queued)
        networkMode: "always",
      },
    },
  });
}

// Singleton for client-side
let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return createQueryClient();
  }
  
  // Browser: reuse existing client
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}

// Query key factories for consistent cache management
export const queryKeys = {
  all: ["forge"] as const,
  
  // Board queries
  boards: () => [...queryKeys.all, "boards"] as const,
  board: (id: string) => [...queryKeys.boards(), id] as const,
  boardWithTasks: (id: string) => [...queryKeys.board(id), "tasks"] as const,
  
  // Task queries  
  tasks: () => [...queryKeys.all, "tasks"] as const,
  task: (id: string) => [...queryKeys.tasks(), id] as const,
  tasksByStatus: (status: string) => [...queryKeys.tasks(), "status", status] as const,
  taskSearch: (query: string) => [...queryKeys.tasks(), "search", query] as const,
  
  // Column queries
  columns: () => [...queryKeys.all, "columns"] as const,
  column: (id: string) => [...queryKeys.columns(), id] as const,

  // Dependency queries
  dependencies: () => [...queryKeys.all, "dependencies"] as const,
  taskDependencies: (taskId: string) => [...queryKeys.dependencies(), taskId] as const,
} as const;
