import { useRef, useState, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDroppable } from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { DraggableTaskCard, TaskCard } from "./TaskCard";
import type { Column, Task } from "./types";

// Card height estimate for virtualizer (doesn't need to be exact)
const CARD_HEIGHT_ESTIMATE = 80;

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  isOver?: boolean;
  isDraggingOver?: boolean;
  onRename?: (columnId: string, newTitle: string) => void;
  onAddTask?: (columnId: string) => void;
  onTaskClick?: (task: Task) => void;
  isDragging?: boolean;
}

/**
 * Inline editable column header
 */
function ColumnHeader({
  column,
  taskCount,
  onRename,
  onAddTask,
  dragHandleProps,
}: {
  column: Column;
  taskCount: number;
  onRename?: (columnId: string, newTitle: string) => void;
  onAddTask?: (columnId: string) => void;
  dragHandleProps?: Record<string, any>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    if (onRename) {
      setEditValue(column.title);
      setIsEditing(true);
    }
  }, [column.title, onRename]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== column.title && onRename) {
      onRename(column.id, trimmed);
    }
    setIsEditing(false);
  }, [editValue, column.id, column.title, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(column.title);
      setIsEditing(false);
    }
  }, [handleSave, column.title]);

  return (
    <div 
      className="flex items-center justify-between p-3 border-b bg-card rounded-t-lg"
      {...(dragHandleProps && !isEditing ? dragHandleProps : {})}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {column.color && (
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />
        )}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="font-semibold text-sm bg-transparent border border-primary/50 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary w-full"
          />
        ) : (
          <h3 
            className={cn(
              "font-semibold text-sm truncate",
              onRename && "cursor-text hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 -my-0.5"
            )}
            onDoubleClick={handleDoubleClick}
            title={onRename ? "Double-click to rename" : undefined}
          >
            {column.title}
          </h3>
        )}
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
          {taskCount}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {column.limit && taskCount > column.limit && (
          <span className="text-xs text-destructive font-medium shrink-0">
            Over limit!
          </span>
        )}
        {onAddTask && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onAddTask(column.id);
            }}
            title="Add task"
          >
            <span className="text-lg leading-none">+</span>
          </Button>
        )}
        {/* Drag handle indicator */}
        {dragHandleProps && (
          <div className="ml-1 opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="4" r="1.5" />
              <circle cx="11" cy="4" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="11" cy="12" r="1.5" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sortable wrapper for draggable columns
 */
export function SortableKanbanColumn(props: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${props.column.id}`,
    data: {
      type: "column",
      column: props.column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SimpleKanbanColumn
        {...props}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

/**
 * Sortable wrapper for virtualized columns
 */
export function SortableVirtualizedKanbanColumn(props: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${props.column.id}`,
    data: {
      type: "column",
      column: props.column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <KanbanColumn
        {...props}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

interface KanbanColumnInternalProps extends KanbanColumnProps {
  dragHandleProps?: Record<string, any>;
}

export function KanbanColumn({
  column,
  tasks,
  isOver,
  isDraggingOver,
  onRename,
  onAddTask,
  onTaskClick,
  isDragging,
  dragHandleProps,
}: KanbanColumnInternalProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Set up droppable zone for the column
  const { setNodeRef, isOver: isDropOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      column,
    },
  });

  // Vertical virtualizer for cards within this column
  // Uses CSS-driven height from flex-1 - no JS measurement needed
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT_ESTIMATE,
    overscan: 5, // Render 5 extra items above/below viewport
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Get sortable IDs for dnd-kit
  const taskIds = tasks.map((task) => `task-${task.id}`);

  const isOverColumn = isOver || isDraggingOver || isDropOver;

  return (
    <div
      className={cn(
        "flex flex-col h-full w-72 shrink-0 bg-muted/30 rounded-lg border",
        isOverColumn && "ring-2 ring-primary/50 bg-muted/50",
        isDragging && "shadow-lg"
      )}
    >
      {/* Column Header - fixed height, won't shrink */}
      <div className="shrink-0">
        <ColumnHeader
          column={column}
          taskCount={tasks.length}
          onRename={onRename}
          onAddTask={onAddTask}
          dragHandleProps={dragHandleProps}
        />
      </div>

      {/* Scrollable Task List with Virtualization - fills remaining space */}
      <div
        ref={(node) => {
          setNodeRef(node);
          (parentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className="flex-1 min-h-0 overflow-auto p-2"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualItem) => {
              const task = tasks[virtualItem.index];
              if (!task) return null;

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="pb-2"
                >
                  <DraggableTaskCard task={task} onClick={onTaskClick} />
                </div>
              );
            })}
          </div>
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Non-virtualized column for small task counts (< 20)
 * Use this when virtualization overhead isn't worth it
 */
export function SimpleKanbanColumn({
  column,
  tasks,
  isOver,
  onRename,
  onAddTask,
  onTaskClick,
  isDragging,
  dragHandleProps,
}: KanbanColumnInternalProps) {
  const { setNodeRef, isOver: isDropOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      column,
    },
  });

  const taskIds = tasks.map((task) => `task-${task.id}`);
  const isOverColumn = isOver || isDropOver;

  return (
    <div
      className={cn(
        "flex flex-col h-full w-72 shrink-0 bg-muted/30 rounded-lg border",
        isOverColumn && "ring-2 ring-primary/50 bg-muted/50",
        isDragging && "shadow-lg"
      )}
    >
      {/* Column Header - fixed height, won't shrink */}
      <div className="shrink-0">
        <ColumnHeader
          column={column}
          taskCount={tasks.length}
          onRename={onRename}
          onAddTask={onAddTask}
          dragHandleProps={dragHandleProps}
        />
      </div>

      <div ref={setNodeRef} className="flex-1 min-h-0 overflow-auto p-2 space-y-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
