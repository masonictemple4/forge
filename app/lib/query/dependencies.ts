import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DependencyGraph } from "@forge/dag";
import { queryKeys } from "./client";
import type { Task } from "./types";

const API_BASE = "/api";

// ============================================================================
// Types
// ============================================================================

export interface DependencyInput {
  blockerId: string;
  blockedId: string;
}

// ============================================================================
// Fetch functions
// ============================================================================

async function addDependency(input: DependencyInput): Promise<DependencyInput> {
  const res = await fetch(`${API_BASE}/dependencies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to add dependency");
  }
  return res.json();
}

async function removeDependency(input: DependencyInput): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/dependencies`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to remove dependency");
  }
  return res.json();
}

// ============================================================================
// Mutation hooks
// ============================================================================

export function useAddDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addDependency,

    onMutate: async ({ blockerId, blockedId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks());

      queryClient.setQueryData<Task[]>(queryKeys.tasks(), (old) =>
        old?.map((task) => {
          if (task.id === blockedId) {
            return { ...task, blockedBy: [...task.blockedBy, blockerId] };
          }
          if (task.id === blockerId) {
            return { ...task, blocks: [...task.blocks, blockedId] };
          }
          return task;
        })
      );

      return { previousTasks };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks(), context.previousTasks);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });
}

export function useRemoveDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeDependency,

    onMutate: async ({ blockerId, blockedId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks());

      queryClient.setQueryData<Task[]>(queryKeys.tasks(), (old) =>
        old?.map((task) => {
          if (task.id === blockedId) {
            return { ...task, blockedBy: task.blockedBy.filter(id => id !== blockerId) };
          }
          if (task.id === blockerId) {
            return { ...task, blocks: task.blocks.filter(id => id !== blockedId) };
          }
          return task;
        })
      );

      return { previousTasks };
    },

    onError: (_err, _vars, context) => {
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
// Client-side DependencyGraph hook
// ============================================================================

/**
 * Build an in-memory DependencyGraph<string> from the tasks array.
 * Provides O(1) lookups for blockers/blocked, cycle detection,
 * topological sorting, and ready-task computation.
 */
export function useDependencyGraph(tasks: Task[] | undefined) {
  return useMemo(() => {
    if (!tasks) return null;
    const edges: Array<[string, string]> = [];
    for (const task of tasks) {
      for (const blockerId of task.blockedBy) {
        edges.push([blockerId, task.id]);
      }
    }
    return DependencyGraph.fromEdges(edges);
  }, [tasks]);
}
