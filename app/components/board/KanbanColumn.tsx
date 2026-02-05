import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
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
import { DraggableTaskCard } from "./TaskCard";
import type { Column, Task } from "./types";

// Card height estimate for virtualizer (fixed, no dynamic measurement)
const CARD_HEIGHT_ESTIMATE = 108; // ~100px card + 8px margin

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

/**
 * Virtualized Kanban column using TanStack Virtual
 * Uses calculated height to ensure virtualizer works correctly
 */
export function KanbanColumn({
  column,
  tasks,
  isOver,
  onRename,
  onAddTask,
  onTaskClick,
  isDragging,
  dragHandleProps,
}: KanbanColumnInternalProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollHeight, setScrollHeight] = useState(400); // fallback height
  const [isMounted, setIsMounted] = useState(false);

  // Set up droppable zone for the column
  const { setNodeRef, isOver: isDropOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      column,
    },
  });

  // Mark as mounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate scroll container height based on column height minus header
  useLayoutEffect(() => {
    if (!isMounted) return;

    const updateHeight = () => {
      if (columnRef.current) {
        const columnHeight = columnRef.current.clientHeight;
        const headerHeight = 52; // header height (p-3 = 12px padding + ~28px content)
        const calculatedHeight = columnHeight - headerHeight;
        if (calculatedHeight > 0) {
          setScrollHeight(calculatedHeight);
        }
      }
    };

    updateHeight();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateHeight);
    if (columnRef.current) {
      resizeObserver.observe(columnRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [isMounted]);

  // Vertical virtualizer for cards within this column
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_HEIGHT_ESTIMATE,
    overscan: 5, // Render 5 extra items above/below viewport
  });

  const virtualItems = virtualizer.getVirtualItems();
  const taskIds = tasks.map((task) => `task-${task.id}`);
  const isOverColumn = isOver || isDropOver;

  return (
    <div
      ref={columnRef}
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

      {/* Scrollable Task List with Virtualization */}
      <div
        ref={(node) => {
          setNodeRef(node);
          (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        style={{ height: scrollHeight }}
        className="overflow-y-auto p-2"
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
                  data-index={virtualItem.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
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
