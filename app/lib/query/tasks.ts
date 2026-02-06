import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { after, before, between } from "@forge/lexorank";
import { queryKeys } from "./client";
import type {
  Task,
  BoardColumn,
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  TaskStatus,
  OptimisticContext,
} from "./types";
import { columnConfig, taskStatuses } from "./types";

const API_BASE = "/api";

// ============================================================================
// Fetch functions
// ============================================================================

async function fetchTasks(status?: TaskStatus): Promise<Task[]> {
  const url = status
    ? `${API_BASE}/tasks?status=${status}`
    : `${API_BASE}/tasks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

async function fetchTask(id: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`);
  if (!res.ok) throw new Error("Task not found");
  return res.json();
}

async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

async function deleteTask(id: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.json();
}

async function moveTask(input: MoveTaskInput): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${input.taskId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetStatus: input.targetStatus,
      beforeId: input.beforeTaskId,
      afterId: input.afterTaskId,
    }),
  });
  if (!res.ok) throw new Error("Failed to move task");
  return res.json();
}

// ============================================================================
// Query hooks
// ============================================================================

export function useTasks(status?: TaskStatus) {
  return useQuery({
    queryKey: status ? queryKeys.tasksByStatus(status) : queryKeys.tasks(),
    queryFn: () => fetchTasks(status),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => fetchTask(id),
    enabled: !!id,
  });
}

// ============================================================================
// Mutation hooks with optimistic updates
// ============================================================================

/**
 * Create task mutation with optimistic UI
 * - Shows task immediately with temp ID
 * - Replaces with server response on success
 * - Removes on failure
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      
      // Snapshot current data
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks());
      
      // Create optimistic task with temp ID
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title: newTask.title,
        description: newTask.description ?? null,
        status: newTask.status ?? "backlog",
        rank: "zzz", // Will be at end
        path: "/",
        blockedBy: [],
        blocks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Optimistically add to cache
      queryClient.setQueryData<Task[]>(queryKeys.tasks(), (old) => 
        old ? [...old, optimisticTask] : [optimisticTask]
      );
      
      // Invalidate board query to trigger recomputation
      queryClient.invalidateQueries({ queryKey: queryKeys.boards() });
      
      return { previousTasks, optimisticTask };
    },
    
    onError: (err, newTask, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks(), context.previousTasks);
      }
    },
    
    onSuccess: (createdTask, variables, context) => {
      // Replace optimistic task with real one
      queryClient.setQueryData<Task[]>(queryKeys.tasks(), (old) => {
        if (!old) return [createdTask];
        return old.map((t) => 
          t.id === context?.optimisticTask.id ? createdTask : t
        );
      });
    },
    
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });
}

/**
 * Update task mutation with optimistic UI
 * - Instantly updates fields
 * - Rolls back on failure
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTaskInput & { id: string }) => 
      updateTask(id, input),
    
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks());
      
      // Optimistically update
      queryClient.setQueryData<Task[]>(queryKeys.tasks(), (old) =>
        old?.map((task) =>
          task.id === id
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        )
      );
      
      return { previousTasks };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks(), context.previousTasks);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });
}

/**
 * Delete task mutation with optimistic UI
 * - Instantly removes task
 * - Provides undo capability via onError rollback
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks());
      const deletedTask = previousTasks?.find((t) => t.id === taskId);
      
      // Optimistically remove
      queryClient.setQueryData<Task[]>(queryKeys.tasks(), (old) =>
        old?.filter((task) => task.id !== taskId)
      );
      
      return { previousTasks, deletedTask };
    },
    
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks(), context.previousTasks);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });
}

/**
 * Move task mutation with optimistic UI
 * - Instantly moves task to new position/status
 * - Rolls back to original position on failure
 */
export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moveTask,
    
    onMutate: async ({ taskId, targetStatus, beforeTaskId, afterTaskId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks());
      const taskToMove = previousTasks?.find((t) => t.id === taskId);
      
      if (!taskToMove) return { previousTasks };
      
      // Calculate optimistic rank
      let newRank = taskToMove.rank;
      if (previousTasks) {
        const targetTasks = previousTasks
          .filter((t) => t.status === targetStatus && t.id !== taskId)
          .sort((a, b) => a.rank.localeCompare(b.rank));

        const beforeTask = beforeTaskId
          ? targetTasks.find((t) => t.id === beforeTaskId) ?? null
          : null;
        const afterTask = afterTaskId
          ? targetTasks.find((t) => t.id === afterTaskId) ?? null
          : null;

        const beforeRank = beforeTask?.rank ?? null;
        const afterRank = afterTask?.rank ?? null;

        try {
          if (afterRank && beforeRank) {
            newRank = between(afterRank, beforeRank);
          } else if (afterRank) {
            newRank = after(afterRank);
          } else if (beforeRank) {
            newRank = before(beforeRank);
          } else if (targetTasks.length > 0) {
            newRank = after(targetTasks[targetTasks.length - 1].rank);
          } else {
            newRank = "V";
          }
        } catch {
          newRank = "V";
        }
      }
      
      // Optimistically update
      queryClient.setQueryData<Task[]>(queryKeys.tasks(), (old) =>
        old?.map((task) =>
          task.id === taskId
            ? { ...task, status: targetStatus, rank: newRank, updatedAt: new Date().toISOString() }
            : task
        )
      );
      
      return { previousTasks };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks(), context.previousTasks);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });
}

// ============================================================================
// Helper: Transform flat task list into board columns
// ============================================================================

export function tasksToBoardColumns(tasks: Task[]): BoardColumn[] {
  const tasksByStatus = new Map<TaskStatus, Task[]>();
  
  // Initialize all columns
  for (const status of taskStatuses) {
    tasksByStatus.set(status, []);
  }
  
  // Group tasks by status
  for (const task of tasks) {
    const statusTasks = tasksByStatus.get(task.status) ?? [];
    statusTasks.push(task);
    tasksByStatus.set(task.status, statusTasks);
  }
  
  // Convert to BoardColumn format, sorted by rank
  return taskStatuses.map((status) => {
    const config = columnConfig[status];
    const statusTasks = tasksByStatus.get(status) ?? [];
    statusTasks.sort((a, b) => a.rank.localeCompare(b.rank));
    
    return {
      id: status,
      title: config.title,
      color: config.color,
      tasks: statusTasks,
    };
  });
}
