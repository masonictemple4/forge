import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { KanbanBoard, generateMockData } from "~/components/board";

export const Route = createFileRoute("/board")({
  component: BoardPage,
});

function BoardPage() {
  // Generate mock data - 5 columns with 50 tasks each (250 total tasks)
  // Try increasing these to stress test: generateMockData(20, 200) = 4000 tasks
  const initialColumns = useMemo(() => generateMockData(5, 50), []);
  
  const [taskMoves, setTaskMoves] = useState<string[]>([]);

  const handleTaskMove = (
    taskId: number,
    sourceColumnId: string,
    targetColumnId: string,
    newRank: string
  ) => {
    const moveLog = `Task ${taskId}: ${sourceColumnId} → ${targetColumnId} (rank: ${newRank})`;
    setTaskMoves((prev) => [moveLog, ...prev.slice(0, 9)]);
    console.log(moveLog);
  };

  const totalTasks = initialColumns.reduce(
    (acc, col) => acc + col.tasks.length,
    0
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔥 Forge Board</h1>
            <p className="text-sm text-muted-foreground">
              Virtualized Kanban • {initialColumns.length} columns • {totalTasks}{" "}
              tasks
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Drag cards to reorder or move between columns
            </span>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-hidden">
        <KanbanBoard
          columns={initialColumns}
          onTaskMove={handleTaskMove}
        />
      </main>

      {/* Activity Log */}
      {taskMoves.length > 0 && (
        <div className="border-t bg-muted/30 px-6 py-3 shrink-0">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">
            Recent Moves
          </h3>
          <div className="flex gap-2 overflow-x-auto">
            {taskMoves.map((move, i) => (
              <span
                key={i}
                className="text-xs bg-background px-2 py-1 rounded border whitespace-nowrap"
              >
                {move}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
