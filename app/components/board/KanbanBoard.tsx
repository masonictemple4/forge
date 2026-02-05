import { useRef, useState, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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

import { 
  KanbanColumn, 
  SimpleKanbanColumn, 
  SortableKanbanColumn, 
  SortableVirtualizedKanbanColumn 
} from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import type { Column, Task, DragData } from "./types";

interface KanbanBoardProps {
  columns: Column[];
  onColumnsChange?: (columns: Column[]) => void;
  onTaskMove?: (
    taskId: number,
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

const COLUMN_WIDTH = 288 + 8; // 288px column + 8px gap
const VIRTUALIZATION_THRESHOLD = 20; // Use virtualization when columns have > 20 tasks

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

  const parentRef = useRef<HTMLDivElement>(null);

  // Update columns when props change
  useMemo(() => {
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

  // Horizontal virtualizer for columns
  const columnVirtualizer = useVirtualizer({
    count: columns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => COLUMN_WIDTH,
    horizontal: true,
    overscan: 2, // Render 2 extra columns on each side
  });

  const virtualColumns = columnVirtualizer.getVirtualItems();
  const columnIds = columns.map((col) => `column-${col.id}`);

  // Find column by ID
  const findColumn = useCallback(
    (id: string): Column | undefined => {
      // Direct column ID match
      const columnId = id.replace("column-", "");
      const directMatch = columns.find((c) => c.id === columnId);
      if (directMatch) return directMatch;

      // Task ID - find containing column
      if (id.startsWith("task-")) {
        const taskId = parseInt(id.replace("task-", ""), 10);
        return columns.find((c) => c.tasks.some((t) => t.id === taskId));
      }

      return undefined;
    },
    [columns]
  );

  // Calculate new rank for task insertion
  const calculateNewRank = useCallback(
    (
      targetColumn: Column,
      targetIndex: number,
      excludeTaskId?: number
    ): string => {
      const tasks = targetColumn.tasks.filter((t) => t.id !== excludeTaskId);

      if (tasks.length === 0) {
        return "V"; // Initial rank
      }

      if (targetIndex === 0) {
        return before(tasks[0].rank);
      }

      if (targetIndex >= tasks.length) {
        return after(tasks[tasks.length - 1].rank);
      }

      const prevTask = tasks[targetIndex - 1];
      const nextTask = tasks[targetIndex];

      return between(prevTask.rank, nextTask.rank);
    },
    []
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DragData;

    if (data?.type === "task" && data.task) {
      setActiveTask(data.task);
    } else if (data?.type === "column" && data.column) {
      setActiveColumn(data.column);
    }
  }, []);

  // Handle drag over (for real-time feedback)
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      setOverId(over?.id as string | null);
    },
    []
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveTask(null);
      setActiveColumn(null);
      setOverId(null);

      if (!over) return;

      const activeData = active.data.current as DragData;
      const overId = over.id as string;

      // Handle column drag
      if (activeData?.type === "column" && activeData.column) {
        const activeColumnId = active.id as string;
        const overColumnId = overId;
        
        if (activeColumnId !== overColumnId && overColumnId.startsWith("column-")) {
          const activeIndex = columns.findIndex(
            (c) => `column-${c.id}` === activeColumnId
          );
          const overIndex = columns.findIndex(
            (c) => `column-${c.id}` === overColumnId
          );

          if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
            const newColumns = arrayMove(columns, activeIndex, overIndex);
            setColumns(newColumns);
            onColumnsChange?.(newColumns);

            // Calculate before/after IDs for API
            const movedColumnId = columns[activeIndex].id;
            const beforeId = overIndex < newColumns.length - 1 
              ? newColumns[overIndex + 1].id 
              : null;
            const afterId = overIndex > 0 
              ? newColumns[overIndex - 1].id 
              : null;

            onColumnReorder?.(movedColumnId, beforeId, afterId);
          }
        }
        return;
      }

      // Handle task drag
      if (activeData?.type === "task" && activeData.task) {
        const task = activeData.task;
        const sourceColumn = findColumn(`task-${task.id}`);
        const targetColumn = findColumn(overId);

        if (!sourceColumn || !targetColumn) return;

        // Calculate target index
        let targetIndex = 0;
        if (overId.startsWith("task-")) {
          const overTaskId = parseInt(overId.replace("task-", ""), 10);
          targetIndex = targetColumn.tasks.findIndex((t) => t.id === overTaskId);
          if (targetIndex === -1) targetIndex = targetColumn.tasks.length;
        } else {
          targetIndex = targetColumn.tasks.length;
        }

        // Same column reorder
        if (sourceColumn.id === targetColumn.id) {
          const sourceIndex = sourceColumn.tasks.findIndex(
            (t) => t.id === task.id
          );
          if (sourceIndex === targetIndex || sourceIndex === targetIndex - 1)
            return;

          const newRank = calculateNewRank(targetColumn, targetIndex, task.id);

          setColumns((prev) =>
            prev.map((col) => {
              if (col.id !== sourceColumn.id) return col;

              const tasks = [...col.tasks];
              const [removed] = tasks.splice(sourceIndex, 1);
              const newIndex =
                targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
              tasks.splice(newIndex, 0, { ...removed, rank: newRank });

              return { ...col, tasks };
            })
          );

          onTaskMove?.(task.id, sourceColumn.id, targetColumn.id, newRank);
        } else {
          // Cross-column move
          const newRank = calculateNewRank(targetColumn, targetIndex);

          setColumns((prev) =>
            prev.map((col) => {
              if (col.id === sourceColumn.id) {
                return {
                  ...col,
                  tasks: col.tasks.filter((t) => t.id !== task.id),
                };
              }
              if (col.id === targetColumn.id) {
                const tasks = [...col.tasks];
                tasks.splice(targetIndex, 0, {
                  ...task,
                  columnId: targetColumn.id,
                  rank: newRank,
                });
                return { ...col, tasks };
              }
              return col;
            })
          );

          onTaskMove?.(task.id, sourceColumn.id, targetColumn.id, newRank);
        }
      }
    },
    [columns, findColumn, calculateNewRank, onTaskMove, onColumnsChange, onColumnReorder]
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
    >
      <div
        ref={parentRef}
        className="flex h-full min-h-0 w-full overflow-auto bg-background p-4"
        style={{
          // Enable horizontal scrolling
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          <div
            style={{
              width: `${columnVirtualizer.getTotalSize()}px`,
              height: "100%",
              position: "relative",
            }}
          >
            {virtualColumns.map((virtualColumn) => {
              const column = columns[virtualColumn.index];
              if (!column) return null;

              const useVirtualization =
                column.tasks.length > VIRTUALIZATION_THRESHOLD;

              return (
                <div
                  key={virtualColumn.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: `${virtualColumn.size}px`,
                    transform: `translateX(${virtualColumn.start}px)`,
                  }}
                  className="pr-2"
                >
                  {useVirtualization ? (
                    <SortableVirtualizedKanbanColumn
                      column={column}
                      tasks={column.tasks}
                      isOver={overId === `column-${column.id}`}
                      onRename={onColumnRename ? handleColumnRename : undefined}
                      onAddTask={onAddTask}
                      onTaskClick={onTaskClick}
                    />
                  ) : (
                    <SortableKanbanColumn
                      column={column}
                      tasks={column.tasks}
                      isOver={overId === `column-${column.id}`}
                      onRename={onColumnRename ? handleColumnRename : undefined}
                      onAddTask={onAddTask}
                      onTaskClick={onTaskClick}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </div>

      {/* Drag Overlay - renders the dragged item */}
      {typeof document !== "undefined" &&
        createPortal(
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} isOverlay />}
            {activeColumn && (
              <div className="w-72 bg-muted/80 rounded-lg border shadow-xl opacity-90">
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
      const task: Task = {
        id: taskId,
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
            ? [taskId - 1]
            : undefined,
        blocks:
          taskIndex % 7 === 0 && taskId + 1 <= colIndex * tasksPerColumn + tasksPerColumn
            ? [taskId + 1]
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
