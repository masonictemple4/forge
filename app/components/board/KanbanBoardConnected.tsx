/**
 * KanbanBoardConnected - Kanban board with TanStack Query integration
 * 
 * This component wraps the base KanbanBoard and provides:
 * - Data fetching via TanStack Query
 * - Optimistic updates for instant responsiveness
 * - Error handling with toast notifications
 * - Automatic cache management
 */

import { useCallback, useMemo } from "react";
import { KanbanBoard } from "./KanbanBoard";
import { useToast } from "~/components/ui/toast";
import {
  useBoard,
  useMoveTask,
  useCreateTask,
  useDeleteTask,
  type Task as ApiTask,
  type TaskStatus,
} from "~/lib/query";
import type { Column, Task } from "./types";

interface KanbanBoardConnectedProps {
  boardId?: string;
}

/**
 * Transform API task to board task format
 */
function apiTaskToBoardTask(task: ApiTask): Task {
  return {
    id: parseInt(task.id, 10) || Date.now(), // Handle temp IDs
    title: task.title,
    description: task.description ?? undefined,
    columnId: task.status,
    rank: task.rank,
    // These would come from additional API data
    labels: undefined,
    assignee: undefined,
    priority: undefined,
    blockedBy: undefined,
    blocks: undefined,
  };
}

/**
 * Transform API columns to board columns format
 */
function transformColumns(
  apiColumns: { id: TaskStatus; title: string; color: string; tasks: ApiTask[] }[]
): Column[] {
  return apiColumns.map((col) => ({
    id: col.id,
    title: col.title,
    color: col.color,
    rank: col.id, // Use status as rank for columns
    tasks: col.tasks.map(apiTaskToBoardTask),
  }));
}

export function KanbanBoardConnected({ boardId = "default" }: KanbanBoardConnectedProps) {
  const { data: board, isLoading, error } = useBoard(boardId);
  const moveTaskMutation = useMoveTask();
  const toast = useToast();

  // Transform data for board component
  const columns = useMemo(() => {
    if (!board?.columns) return [];
    return transformColumns(board.columns);
  }, [board?.columns]);

  // Handle task move with optimistic update
  const handleTaskMove = useCallback(
    (
      taskId: number,
      sourceColumnId: string,
      targetColumnId: string,
      newRank: string
    ) => {
      // Find adjacent tasks for the move request
      const targetColumn = columns.find((c) => c.id === targetColumnId);
      const tasksInTarget = targetColumn?.tasks.filter((t) => t.id !== taskId) ?? [];
      const sortedTasks = [...tasksInTarget].sort((a, b) => a.rank.localeCompare(b.rank));
      
      // Find position based on newRank
      let beforeTaskId: string | null = null;
      let afterTaskId: string | null = null;
      
      for (let i = 0; i < sortedTasks.length; i++) {
        if (sortedTasks[i].rank > newRank) {
          beforeTaskId = String(sortedTasks[i].id);
          if (i > 0) {
            afterTaskId = String(sortedTasks[i - 1].id);
          }
          break;
        }
      }
      
      // If no beforeTask found, we're at the end
      if (!beforeTaskId && sortedTasks.length > 0) {
        afterTaskId = String(sortedTasks[sortedTasks.length - 1].id);
      }

      moveTaskMutation.mutate(
        {
          taskId: String(taskId),
          targetStatus: targetColumnId as TaskStatus,
          beforeTaskId,
          afterTaskId,
        },
        {
          onError: (err) => {
            toast.error(
              "Failed to move task",
              err instanceof Error ? err.message : "Please try again"
            );
          },
        }
      );
    },
    [columns, moveTaskMutation, toast]
  );

  // Handle column reorder (not persisted to backend yet)
  const handleColumnsChange = useCallback((newColumns: Column[]) => {
    // For now, columns are static (based on task status)
    // Could implement custom column ordering in the future
    console.log("Columns reordered:", newColumns);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading board...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load board</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <KanbanBoard
      columns={columns}
      onColumnsChange={handleColumnsChange}
      onTaskMove={handleTaskMove}
    />
  );
}

export default KanbanBoardConnected;
