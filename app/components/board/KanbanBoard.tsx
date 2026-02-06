import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { between, after, before } from "@forge/lexorank";

import { SortableVirtualizedKanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import type { Column, Task, DragData } from "./types";

interface KanbanBoardProps {
  columns: Column[];
  onColumnsChange?: (columns: Column[]) => void;
  onTaskMove?: (
    taskId: string,
    sourceColumnId: string,
    targetColumnId: string,
    newRank: string
  ) => void;
  onColumnReorder?: (
    columnId: string,
    beforeId: string | null,
    afterId: string | null
  ) => void;
  onColumnRename?: (columnId: string, newTitle: string) => void;
  onAddTask?: (columnId: string) => void;
  onTaskClick?: (task: Task) => void;
}

export function KanbanBoard({
  columns: initialColumns,
  onColumnsChange,
  onTaskMove,
  onColumnReorder,
  onColumnRename,
  onAddTask,
  onTaskClick,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const dragSourceColumnRef = useRef<string | null>(null);
  const columnsBeforeDragRef = useRef<Column[]>([]);

  // Ref tracks latest columns so handleDragEnd never reads a stale closure
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  // Sync from props only when initialColumns actually changes —
  // NOT when activeTask/activeColumn change (that was overwriting reorders).
  const isDraggingRef = useRef(false);
  isDraggingRef.current = !!activeTask || !!activeColumn;

  useEffect(() => {
    if (isDraggingRef.current) return;
    setColumns(initialColumns);
  }, [initialColumns]);

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columnIds = useMemo(() => columns.map((col) => `column-${col.id}`), [columns]);

  const calculateRankBetween = useCallback((afterRank: string | null, beforeRank: string | null): string => {
    if (afterRank && beforeRank) {
      return between(afterRank, beforeRank);
    }
    if (afterRank) {
      return after(afterRank);
    }
    if (beforeRank) {
      return before(beforeRank);
    }
    return "V";
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DragData;

    columnsBeforeDragRef.current = columns;

    if (data?.type === "task" && data.task) {
      setActiveTask(data.task);
      const sourceCol = columns.find(c => c.tasks.some(t => t.id === data.task!.id));
      dragSourceColumnRef.current = sourceCol?.id ?? null;
    } else if (data?.type === "column" && data.column) {
      setActiveColumn(data.column);
    }
  }, [columns]);

  // Handle drag over — move tasks between columns for real-time feedback.
  // Uses functional state update to avoid stale closure issues during rapid drag events.
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) {
        setOverId(null);
        return;
      }

      const overIdStr = over.id as string;
      setOverId(overIdStr);

      const activeData = active.data.current as DragData;
      if (activeData?.type !== "task") return;

      const activeId = active.id as string;
      const taskId = activeId.replace("task-", "");

      setColumns(prev => {
        // Find columns using latest state (prev), not stale closure
        const activeCol = prev.find(c => c.tasks.some(t => t.id === taskId));

        let overCol: typeof activeCol;
        if (overIdStr.startsWith("column-")) {
          const colId = overIdStr.replace("column-", "");
          overCol = prev.find(c => c.id === colId);
        } else if (overIdStr.startsWith("task-")) {
          const overTaskId = overIdStr.replace("task-", "");
          overCol = prev.find(c => c.tasks.some(t => t.id === overTaskId));
        }

        if (!activeCol || !overCol || activeCol.id === overCol.id) return prev;

        const task = activeCol.tasks.find(t => t.id === taskId);
        if (!task) return prev;

        let insertIndex = overCol.tasks.length;
        if (overIdStr.startsWith("task-")) {
          const overTaskId = overIdStr.replace("task-", "");
          const idx = overCol.tasks.findIndex(t => t.id === overTaskId);
          if (idx !== -1) insertIndex = idx;
        }

        const next = prev.map(col => {
          if (col.id === activeCol.id) {
            return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
          }
          if (col.id === overCol!.id) {
            const tasks = [...col.tasks];
            tasks.splice(insertIndex, 0, { ...task, columnId: col.id });
            return { ...col, tasks };
          }
          return col;
        });
        columnsRef.current = next;
        return next;
      });
    },
    []
  );

  // Handle drag cancel — restore columns to pre-drag state
  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setActiveColumn(null);
    setOverId(null);
    setColumns(columnsBeforeDragRef.current);
    dragSourceColumnRef.current = null;
  }, []);

  // Handle drag end — uses columnsRef.current to avoid stale closures
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const activeData = active.data.current as DragData;
      const sourceColumnId = dragSourceColumnRef.current;

      setActiveTask(null);
      setActiveColumn(null);
      setOverId(null);
      dragSourceColumnRef.current = null;

      if (!over) {
        // Dropped outside any droppable — revert
        setColumns(columnsBeforeDragRef.current);
        columnsRef.current = columnsBeforeDragRef.current;
        return;
      }

      // Read latest columns from ref (handleDragOver may have mutated via setColumns)
      const cols = columnsRef.current;
      const overIdStr = over.id as string;

      // Handle column drag
      if (activeData?.type === "column" && activeData.column) {
        const activeColumnId = active.id as string;
        let overColumnId = overIdStr;

        // If dropped on a task, find its parent column
        if (overColumnId.startsWith("task-")) {
          const taskId = overColumnId.replace("task-", "");
          const parentCol = cols.find(c => c.tasks.some(t => t.id === taskId));
          if (parentCol) overColumnId = `column-${parentCol.id}`;
        }

        if (activeColumnId !== overColumnId && overColumnId.startsWith("column-")) {
          const activeIndex = cols.findIndex(
            (c) => `column-${c.id}` === activeColumnId
          );
          const overIndex = cols.findIndex(
            (c) => `column-${c.id}` === overColumnId
          );

          if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
            const newColumns = arrayMove(cols, activeIndex, overIndex);
            columnsRef.current = newColumns;
            setColumns(newColumns);
            onColumnsChange?.(newColumns);

            const movedColumnId = cols[activeIndex].id;
            const newIndex = newColumns.findIndex((column) => column.id === movedColumnId);
            const beforeId = newIndex < newColumns.length - 1
              ? newColumns[newIndex + 1].id
              : null;
            const afterId = newIndex > 0
              ? newColumns[newIndex - 1].id
              : null;

            onColumnReorder?.(movedColumnId, beforeId, afterId);
          }
        }
        return;
      }

      // Handle task drag
      // Cross-column moves already happened in handleDragOver.
      // Here we finalize the position within the current column.
      if (activeData?.type === "task" && activeData.task) {
        const taskId = activeData.task.id;

        // Find the column the task is currently in (using ref for latest state)
        const currentColumn = cols.find(c => c.tasks.some(t => t.id === taskId));
        if (!currentColumn) return;

        const activeIndex = currentColumn.tasks.findIndex(t => t.id === taskId);
        if (activeIndex === -1) return;

        // Find where it was dropped
        let overIndex = activeIndex;
        if (overIdStr.startsWith("task-")) {
          const overTaskId = overIdStr.replace("task-", "");
          const idx = currentColumn.tasks.findIndex(t => t.id === overTaskId);
          if (idx !== -1) overIndex = idx;
        }

        // Reorder if needed
        const reorderedTasks = activeIndex !== overIndex
          ? arrayMove(currentColumn.tasks, activeIndex, overIndex)
          : currentColumn.tasks;

        const finalIndex = reorderedTasks.findIndex(t => t.id === taskId);
        const prevTask = finalIndex > 0 ? reorderedTasks[finalIndex - 1] : null;
        const nextTask = finalIndex < reorderedTasks.length - 1
          ? reorderedTasks[finalIndex + 1]
          : null;
        const newRank = calculateRankBetween(prevTask?.rank ?? null, nextTask?.rank ?? null);

        const newCols = cols.map(col => {
          if (col.id !== currentColumn.id) return col;
          return {
            ...col,
            tasks: reorderedTasks.map(t =>
              t.id === taskId ? { ...t, rank: newRank } : t
            ),
          };
        });
        columnsRef.current = newCols;
        setColumns(newCols);

        const origSourceId = sourceColumnId ?? currentColumn.id;
        onTaskMove?.(taskId, origSourceId, currentColumn.id, newRank);
      }
    },
    [
      calculateRankBetween,
      onTaskMove,
      onColumnsChange,
      onColumnReorder,
    ]
  );

  // Handle column rename
  const handleColumnRename = useCallback(
    (columnId: string, newTitle: string) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, title: newTitle } : col
        )
      );
      onColumnRename?.(columnId, newTitle);
    },
    [onColumnRename]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="flex h-full min-h-0 w-full overflow-x-auto overflow-y-hidden bg-background p-4 gap-2"
      >
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((column) => {
            const columnIsOver =
              overId === `column-${column.id}` ||
              (overId != null &&
                overId.startsWith("task-") &&
                column.tasks.some(t => `task-${t.id}` === overId));
            return (
              <SortableVirtualizedKanbanColumn
                key={column.id}
                column={column}
                tasks={column.tasks}
                isOver={columnIsOver}
                onRename={onColumnRename ? handleColumnRename : undefined}
                onAddTask={onAddTask}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </SortableContext>
      </div>

      {/* Drag Overlay - renders the dragged item */}
      {typeof document !== "undefined" &&
        createPortal(
          <DragOverlay
            dropAnimation={{
              duration: 170,
              easing: "cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            {activeTask && <TaskCard task={activeTask} isOverlay />}
            {activeColumn && (
              <div className="w-72 bg-card/95 rounded-lg border shadow-lg opacity-95">
                <div className="flex items-center gap-2 p-3 border-b bg-card rounded-t-lg">
                  {activeColumn.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: activeColumn.color }}
                    />
                  )}
                  <h3 className="font-semibold text-sm">{activeColumn.title}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {activeColumn.tasks.length}
                  </span>
                </div>
                <div className="p-3 text-sm text-muted-foreground">
                  {activeColumn.tasks.length} tasks
                </div>
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}

/**
 * Generate mock data for testing the board with many items
 */
export function generateMockData(
  columnCount: number,
  tasksPerColumn: number
): Column[] {
  const statuses = [
    { id: "backlog", title: "Backlog", color: "#6366f1" },
    { id: "todo", title: "To Do", color: "#3b82f6" },
    { id: "in-progress", title: "In Progress", color: "#f59e0b" },
    { id: "review", title: "Review", color: "#8b5cf6" },
    { id: "done", title: "Done", color: "#22c55e" },
  ];

  const priorities: Task["priority"][] = ["low", "medium", "high", "critical"];
  const labels = ["frontend", "backend", "bug", "feature", "docs", "urgent"];

  let taskId = 0;
  let currentRank = "V";

  return Array.from({ length: columnCount }, (_, colIndex) => {
    const status = statuses[colIndex % statuses.length];
    currentRank = "V"; // Reset rank for each column

    const tasks: Task[] = Array.from({ length: tasksPerColumn }, (_, taskIndex) => {
      taskId++;
      const taskIdString = String(taskId);
      const task: Task = {
        id: taskIdString,
        title: `Task ${taskId}: ${status.title} Item ${taskIndex + 1}`,
        description:
          taskIndex % 3 === 0
            ? `This is a longer description for task ${taskId} that might span multiple lines and test text truncation.`
            : undefined,
        columnId: status.id,
        rank: currentRank,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        labels:
          taskIndex % 2 === 0
            ? labels.slice(0, Math.floor(Math.random() * 3) + 1)
            : undefined,
        assignee: taskIndex % 4 === 0 ? "user" + (taskIndex % 5) : undefined,
        blockedBy:
          taskIndex > 0 && taskIndex % 5 === 0
            ? [String(taskId - 1)]
            : undefined,
        blocks:
          taskIndex % 7 === 0 && taskId + 1 <= colIndex * tasksPerColumn + tasksPerColumn
            ? [String(taskId + 1)]
            : undefined,
      };

      // Generate next rank
      currentRank = currentRank + "o"; // Simple incrementing for mock

      return task;
    });

    return {
      id: `${status.id}-${colIndex}`,
      title: colIndex < statuses.length ? status.title : `${status.title} ${Math.floor(colIndex / statuses.length) + 1}`,
      tasks,
      rank: "V" + "o".repeat(colIndex),
      color: status.color,
      limit: status.id === "in-progress" ? 5 : undefined,
    };
  });
}
