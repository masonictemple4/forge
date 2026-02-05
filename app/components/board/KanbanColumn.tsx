import { useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "~/lib/utils";
import { DraggableTaskCard, TaskCard } from "./TaskCard";
import type { Column, Task } from "./types";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  isOver?: boolean;
  isDraggingOver?: boolean;
}

const CARD_HEIGHT = 120; // Approximate height of a task card in pixels
const CARD_GAP = 8;

export function KanbanColumn({
  column,
  tasks,
  isOver,
  isDraggingOver,
}: KanbanColumnProps) {
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
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + CARD_GAP,
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
        isOverColumn && "ring-2 ring-primary/50 bg-muted/50"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-2">
          {column.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
          )}
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        {column.limit && tasks.length > column.limit && (
          <span className="text-xs text-destructive font-medium">
            Over limit!
          </span>
        )}
      </div>

      {/* Scrollable Task List with Virtualization */}
      <div
        ref={(node) => {
          setNodeRef(node);
          (parentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className="flex-1 overflow-auto p-2"
        style={{
          // Ensure scrolling works properly
          contain: "strict",
        }}
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
                  <DraggableTaskCard task={task} />
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
}: KanbanColumnProps) {
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
        isOverColumn && "ring-2 ring-primary/50 bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-2">
          {column.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
          )}
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-auto p-2 space-y-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} />
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
