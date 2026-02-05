import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "./client";
import { useTasks, tasksToBoardColumns } from "./tasks";
import type { Board, BoardColumn, Task, TaskStatus } from "./types";
import { taskStatuses, columnConfig } from "./types";

const API_BASE = "/api";

// ============================================================================
// Board fetch functions
// ============================================================================

/**
 * Fetch a board with all its columns and tasks
 * Currently uses task status as columns (no separate boards table)
 */
async function fetchBoard(id: string): Promise<Board> {
  const res = await fetch(`${API_BASE}/boards/${id}`);
  if (!res.ok) throw new Error("Failed to fetch board");
  return res.json();
}

// ============================================================================
// Board query hooks
// ============================================================================

/**
 * Use board data - derives columns from task status
 * This hook computes board columns from the tasks query
 * for instant optimistic updates across the entire board
 */
export function useBoard(boardId: string = "default") {
  const { data: tasks, isLoading, error, refetch } = useTasks();
  const columns = useMemo(() => (tasks ? tasksToBoardColumns(tasks) : []), [tasks]);
  const data = useMemo(
    () =>
      ({
        id: boardId,
        name: "Board",
        columns,
      } as Board),
    [boardId, columns]
  );
  
  return {
    data,
    tasks,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Direct board fetch (if using server-side board aggregation)
 * Falls back to client-side computation if API not available
 */
export function useBoardDirect(boardId: string) {
  return useQuery({
    queryKey: queryKeys.boardWithTasks(boardId),
    queryFn: () => fetchBoard(boardId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================================================
// Board selectors - for efficient partial subscriptions
// ============================================================================

/**
 * Get tasks for a specific column/status
 */
export function useColumnTasks(status: TaskStatus) {
  const { data: tasks } = useTasks();
  
  if (!tasks) return [];
  
  return tasks
    .filter((t) => t.status === status)
    .sort((a, b) => a.rank.localeCompare(b.rank));
}

/**
 * Get column metadata (count, color, title)
 */
export function useColumnInfo(status: TaskStatus) {
  const tasks = useColumnTasks(status);
  const config = columnConfig[status];
  
  return {
    id: status,
    title: config.title,
    color: config.color,
    taskCount: tasks.length,
  };
}

// ============================================================================
// Board utility functions
// ============================================================================

/**
 * Find which column a task belongs to
 */
export function findTaskColumn(tasks: Task[], taskId: string): TaskStatus | null {
  const task = tasks.find((t) => t.id === taskId);
  return task?.status ?? null;
}

/**
 * Get task's position within its column
 */
export function getTaskPosition(tasks: Task[], taskId: string): number {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return -1;
  
  const columnTasks = tasks
    .filter((t) => t.status === task.status)
    .sort((a, b) => a.rank.localeCompare(b.rank));
  
  return columnTasks.findIndex((t) => t.id === taskId);
}

/**
 * Check if a task can be moved to a status (e.g., WIP limits)
 */
export function canMoveToStatus(
  tasks: Task[],
  taskId: string,
  targetStatus: TaskStatus,
  wipLimits?: Partial<Record<TaskStatus, number>>
): boolean {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;
  
  // Already in target status
  if (task.status === targetStatus) return true;
  
  // Check WIP limit
  const limit = wipLimits?.[targetStatus];
  if (limit !== undefined) {
    const currentCount = tasks.filter((t) => t.status === targetStatus).length;
    if (currentCount >= limit) return false;
  }
  
  return true;
}
