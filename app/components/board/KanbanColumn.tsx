import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { TaskCard, DraggableTaskCard } from "./TaskCard";
import type { Column, Task } from "./types";

// Item size estimate for virtualizer. Real size is measured per item.
const CARD_HEIGHT_ESTIMATE = 120;
const CARD_GAP = 8;

/**
 * Virtualized sortable item that combines TanStack Virtual positioning with dnd-kit
 * The key: virtualizer controls base Y position, dnd-kit transform is added on top
 */
interface VirtualizedSortableItemProps {
  task: Task;
  virtualIndex: number;
  virtualStart: number;
  onMeasure?: (node: HTMLDivElement | null) => void;
  onClick?: (task: Task) => void;
}

function VirtualizedSortableItem({
  task,
  virtualIndex,
  virtualStart,
  onMeasure,
  onClick,
}: VirtualizedSortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
    isSorting,
  } = useSortable({
    id: `task-${task.id}`,
    data: {
      type: "task",
      task,
    },
    // Disable dnd-kit layout animations — they conflict with virtualizer
    // remounting items and cause tasks to fly in from wrong positions.
    animateLayoutChanges: () => false,
  });

  // Position via `top` (virtualizer, instant) and `transform` (dnd-kit sort offset, animated).
  // Keeping them separate prevents virtualStart changes from being animated.
  const sortTransform = !isDragging && transform
    ? `translate3d(${transform.x ?? 0}px, ${transform.y ?? 0}px, 0)`
    : undefined;

  const style: React.CSSProperties = {
    position: "absolute",
    top: virtualStart,
    left: 0,
    width: "100%",
    transform: sortTransform,
    transition: isSorting && !isDragging && transform
      ? "transform 150ms ease"
      : undefined,
    boxSizing: "border-box",
    paddingBottom: CARD_GAP,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    onClick?.(task);
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        onMeasure?.(node);
      }}
      data-index={virtualIndex}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

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
    transition: transition ? "transform 180ms cubic-bezier(0.2, 0, 0, 1)" : undefined,
    opacity: isDragging ? 0.75 : 1,
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
    estimateSize: () => CARD_HEIGHT_ESTIMATE + CARD_GAP,
    getItemKey: (index) => tasks[index]?.id ?? index,
    overscan: 5, // Render 5 extra items above/below viewport
  });

  // Recompute measurements when task ordering/content changes.
  useEffect(() => {
    virtualizer.measure();
  }, [tasks, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();
  const taskIds = tasks.map((task) => `task-${task.id}`);
  const isOverColumn = isOver;

  return (
    <div
      ref={columnRef}
      className={cn(
        "flex flex-col h-full w-72 shrink-0 bg-muted/30 rounded-lg border",
        isOverColumn && "ring-1 ring-primary/35 bg-muted/40",
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
        ref={scrollRef}
        style={{ height: scrollHeight }}
        className="overflow-y-auto p-2"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {/* SSR/hydration: render first few items normally, then switch to virtualized after mount */}
          {!isMounted ? (
            // During SSR: render first ~5 items for initial paint
            <div className="flex flex-col" style={{ gap: CARD_GAP }}>
              {tasks.slice(0, 5).map((task) => (
                <DraggableTaskCard key={task.id} task={task} onClick={onTaskClick} />
              ))}
              {tasks.length > 5 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Loading {tasks.length - 5} more...
                </div>
              )}
            </div>
          ) : (
            // After mount: use virtualization with combined transforms
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
                  <VirtualizedSortableItem
                    key={task.id}
                    task={task}
                    virtualIndex={virtualItem.index}
                    virtualStart={virtualItem.start}
                    onMeasure={(node) => {
                      if (node) virtualizer.measureElement(node);
                    }}
                    onClick={onTaskClick}
                  />
                );
              })}
            </div>
          )}
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
    transition: transition ? "transform 180ms cubic-bezier(0.2, 0, 0, 1)" : undefined,
    opacity: isDragging ? 0.75 : 1,
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
