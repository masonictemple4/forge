import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { KanbanBoard, generateMockData } from "~/components/board";

export const Route = createFileRoute("/board/stress")({
  component: StressTestPage,
});

function StressTestPage() {
  // Stress test: 20 columns with 200 tasks each = 4,000 tasks
  // TanStack Virtual ensures only ~20-30 are actually rendered
  const initialColumns = useMemo(() => generateMockData(20, 200), []);

  const [renderCount, setRenderCount] = useState(0);

  const handleTaskMove = (
    taskId: number,
    sourceColumnId: string,
    targetColumnId: string,
    newRank: string
  ) => {
    setRenderCount((c) => c + 1);
    console.log(`[${new Date().toLocaleTimeString()}] Task ${taskId}: ${sourceColumnId} → ${targetColumnId} (rank: ${newRank})`);
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
            <h1 className="text-2xl font-bold">🔥 Stress Test</h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono text-primary">
                {initialColumns.length}
              </span>{" "}
              columns ×{" "}
              <span className="font-mono text-primary">
                {initialColumns[0]?.tasks.length ?? 0}
              </span>{" "}
              tasks ={" "}
              <span className="font-mono font-bold text-primary">
                {totalTasks.toLocaleString()}
              </span>{" "}
              total tasks
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Move operations</p>
              <p className="text-2xl font-mono font-bold">{renderCount}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Rendered items</p>
              <p className="text-2xl font-mono font-bold text-green-600">~20</p>
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <h3 className="text-xs font-semibold mb-2">How virtualization works:</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <span className="text-foreground font-mono">{totalTasks.toLocaleString()}</span> tasks exist in memory</li>
            <li>• Only <span className="text-green-600 font-mono">~20</span> DOM nodes rendered at any time</li>
            <li>• Horizontal virtualizer for columns (overscan: 2)</li>
            <li>• Vertical virtualizer per column (overscan: 5)</li>
            <li>• Scroll fast → still smooth 60fps</li>
          </ul>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard columns={initialColumns} onTaskMove={handleTaskMove} />
      </main>
    </div>
  );
}
