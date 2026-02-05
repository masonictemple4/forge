/**
 * API types for TanStack Query layer
 * These match the server-side DB types but are client-friendly
 */

export const taskStatuses = ["backlog", "todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  rank: string;
  path: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BoardColumn {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  columns: BoardColumn[];
}

// Mutation payloads
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  parentId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  rank?: string;
}

export interface MoveTaskInput {
  taskId: string;
  targetStatus: TaskStatus;
  /** ID of task to insert before, or null for end of list */
  beforeTaskId: string | null;
  /** ID of task to insert after, or null for start of list */
  afterTaskId: string | null;
}

// Optimistic update context types
export interface OptimisticContext<T> {
  previousData: T | undefined;
}

// Column display config
export const columnConfig: Record<TaskStatus, { title: string; color: string }> = {
  backlog: { title: "Backlog", color: "#6366f1" },
  todo: { title: "To Do", color: "#3b82f6" },
  in_progress: { title: "In Progress", color: "#f59e0b" },
  review: { title: "Review", color: "#8b5cf6" },
  done: { title: "Done", color: "#22c55e" },
};
