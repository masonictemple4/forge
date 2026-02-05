import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { Task } from "./types";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  isOverlay?: boolean;
  onClick?: () => void;
}

const priorityColors = {
  low: "border-l-green-500",
  medium: "border-l-yellow-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

export function TaskCard({ task, isDragging, isOverlay, onClick }: TaskCardProps) {
  const hasBlockers = task.blockedBy && task.blockedBy.length > 0;
  const isBlocking = task.blocks && task.blocks.length > 0;

  return (
    <Card
      className={cn(
        "cursor-grab border-l-4 transition-shadow hover:shadow-md",
        task.priority ? priorityColors[task.priority] : "border-l-transparent",
        isOverlay && "shadow-lg scale-[1.01] cursor-grabbing",
        hasBlockers && "opacity-75 bg-status-blocked/10"
      )}
    >
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-medium leading-tight">
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-1">
          {/* Dependency indicators */}
          {hasBlockers && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              🚫 Blocked ({task.blockedBy!.length})
            </span>
          )}
          {isBlocking && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              ⏳ Blocking ({task.blocks!.length})
            </span>
          )}
          
          {/* Labels */}
          {task.labels?.slice(0, 3).map((label) => (
            <span
              key={label}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground"
            >
              {label}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          {task.assignee && (
            <span className="text-[10px] text-muted-foreground">
              @{task.assignee}
            </span>
          )}
          {task.dueDate && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Consistent animation timing for all sortable items
const ANIMATION_DURATION = 170;
const ANIMATION_EASING = "cubic-bezier(0.2, 0, 0, 1)";

interface DraggableTaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
}

/**
 * Draggable wrapper for TaskCard with dnd-kit
 * Uses consistent animation for both in-column and cross-column moves
 */
export function DraggableTaskCard({ task, onClick }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({
    id: `task-${task.id}`,
    data: {
      type: "task",
      task,
    },
    // Consistent animation config
    animateLayoutChanges: () => true,
  });

  // Use consistent transition timing for all moves (in-column and cross-column)
  // Only apply transition when actually sorting/moving, not during initial drag
  const customTransition = isSorting || transition
    ? `transform ${ANIMATION_DURATION}ms ${ANIMATION_EASING}`
    : undefined;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: customTransition,
    // Hide original item during drag (DragOverlay shows the preview)
    opacity: isDragging ? 0 : 1,
  };

  // Track if this was a drag vs click
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if we're dragging
    if (isDragging) return;
    onClick?.(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="h-full"
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}
