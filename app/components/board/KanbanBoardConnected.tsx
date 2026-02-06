/**
 * KanbanBoardConnected - Kanban board with TanStack Query integration
 * 
 * This component wraps the base KanbanBoard and provides:
 * - Data fetching via TanStack Query
 * - Optimistic updates for instant responsiveness
 * - Error handling with toast notifications
 * - Column reordering and renaming
 * - Task CRUD operations (create, read, update, delete)
 * - Automatic cache management
 */

import { useCallback, useMemo, useState } from "react";
import { KanbanBoard } from "./KanbanBoard";
import { useToast } from "~/components/ui/toast";
import {
  useBoard,
  useMoveTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  type Task as ApiTask,
  type TaskStatus,
} from "~/lib/query";
import type { Column, Task } from "./types";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { TaskFormDialog, type TaskFormData } from "./TaskFormDialog";

interface KanbanBoardConnectedProps {
  boardId?: string;
}

/**
 * Transform API task to board task format
 */
function apiTaskToBoardTask(task: ApiTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    columnId: task.status,
    rank: task.rank,
    labels: undefined,
    assignee: undefined,
    priority: undefined,
    blockedBy: task.blockedBy.length > 0 ? task.blockedBy : undefined,
    blocks: task.blocks.length > 0 ? task.blocks : undefined,
  };
}

/**
 * Transform API columns to board columns format
 */
function transformColumns(
  apiColumns: { id: TaskStatus; title: string; color: string; tasks: ApiTask[] }[]
): Column[] {
  return apiColumns.map((col, index) => ({
    id: col.id,
    title: col.title,
    color: col.color,
    rank: String(index), // Use index as rank for status-based columns
    tasks: col.tasks.map(apiTaskToBoardTask),
  }));
}

export function KanbanBoardConnected({ boardId = "default" }: KanbanBoardConnectedProps) {
  const { data: board, isLoading, error } = useBoard(boardId);
  const moveTaskMutation = useMoveTask();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toast = useToast();

  // Dialog states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<string>("backlog");

  // Transform data for board component
  const columns = useMemo(() => {
    if (!board?.columns) return [];
    return transformColumns(board.columns);
  }, [board?.columns]);

  // Handle task move with optimistic update
  const handleTaskMove = useCallback(
    (
      taskId: string,
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
          taskId,
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

  // Handle column reorder (columns are status-based, so this is informational only)
  const handleColumnReorder = useCallback(
    (columnId: string, beforeId: string | null, afterId: string | null) => {
      // For status-based columns, we don't persist reordering to backend
      // This could be extended to support custom column orders in the future
      console.log("Column reorder:", { columnId, beforeId, afterId });
    },
    []
  );

  // Handle column rename (columns are status-based, so this is informational only)
  const handleColumnRename = useCallback(
    (columnId: string, newTitle: string) => {
      // For status-based columns, we don't persist renaming to backend
      // This could be extended to support custom column names in the future
      console.log("Column rename:", { columnId, newTitle });
      toast.info("Column renamed", "Note: Column names are not persisted for status-based boards");
    },
    [toast]
  );

  // Handle column changes (for local state sync)
  const handleColumnsChange = useCallback((newColumns: Column[]) => {
    // Local state is managed by KanbanBoard
    console.log("Columns changed:", newColumns.map(c => c.title).join(", "));
  }, []);

  // Handle task click - open detail dialog
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowDetailDialog(true);
  }, []);

  // Handle add task button click
  const handleAddTask = useCallback((columnId: string) => {
    setCreateColumnId(columnId);
    setShowCreateDialog(true);
  }, []);

  // Handle create task
  const handleCreateTask = useCallback(
    (data: TaskFormData) => {
      createTaskMutation.mutate(
        {
          title: data.title,
          description: data.description,
          status: (data.status as TaskStatus) ?? "backlog",
        },
        {
          onSuccess: () => {
            toast.success("Task created", "Your new task has been added to the board");
            setShowCreateDialog(false);
          },
          onError: (err) => {
            toast.error(
              "Failed to create task",
              err instanceof Error ? err.message : "Please try again"
            );
          },
        }
      );
    },
    [createTaskMutation, toast]
  );

  // Handle edit task
  const handleEditTask = useCallback(
    (task: Task, data: TaskFormData) => {
      updateTaskMutation.mutate(
        {
          id: task.id,
          title: data.title,
          description: data.description,
          status: data.status as TaskStatus,
        },
        {
          onSuccess: () => {
            toast.success("Task updated", "Your changes have been saved");
          },
          onError: (err) => {
            toast.error(
              "Failed to update task",
              err instanceof Error ? err.message : "Please try again"
            );
          },
        }
      );
    },
    [updateTaskMutation, toast]
  );

  // Handle delete task
  const handleDeleteTask = useCallback(
    (task: Task) => {
      deleteTaskMutation.mutate(task.id, {
        onSuccess: () => {
          toast.success("Task deleted", "The task has been removed from the board");
        },
        onError: (err) => {
          toast.error(
            "Failed to delete task",
            err instanceof Error ? err.message : "Please try again"
          );
        },
      });
    },
    [deleteTaskMutation, toast]
  );

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
    <>
      <KanbanBoard
        columns={columns}
        onColumnsChange={handleColumnsChange}
        onTaskMove={handleTaskMove}
        onColumnReorder={handleColumnReorder}
        onColumnRename={handleColumnRename}
        onAddTask={handleAddTask}
        onTaskClick={handleTaskClick}
      />

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        isEditLoading={updateTaskMutation.isPending}
        isDeleteLoading={deleteTaskMutation.isPending}
      />

      {/* Create Task Dialog */}
      <TaskFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateTask}
        defaultStatus={createColumnId}
        isLoading={createTaskMutation.isPending}
      />
    </>
  );
}

export default KanbanBoardConnected;
