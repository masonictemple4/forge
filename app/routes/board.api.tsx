import { createFileRoute, Link } from "@tanstack/react-router";
import { KanbanBoardConnected } from "~/components/board/KanbanBoardConnected";
import { useCreateTask, useDeleteTask } from "~/lib/query";
import { useToast } from "~/components/ui/toast";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/board/api")({
  component: ApiBoardPage,
});

function ApiBoardPage() {
  const createTaskMutation = useCreateTask();
  const deleteTaskMutation = useDeleteTask();
  const toast = useToast();

  const handleCreateTask = () => {
    createTaskMutation.mutate(
      {
        title: `New Task ${Date.now().toString(36)}`,
        description: "Created via optimistic UI",
        status: "backlog",
      },
      {
        onSuccess: () => {
          toast.success("Task created", "Your task is now visible on the board");
        },
        onError: (err) => {
          toast.error(
            "Failed to create task",
            err instanceof Error ? err.message : "Unknown error"
          );
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔥 Forge Board (API)</h1>
            <p className="text-sm text-muted-foreground">
              TanStack Query • Optimistic Updates • Real-time Sync
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? "Creating..." : "+ New Task"}
            </Button>
            <Link
              to="/board"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Mock Data Demo →
            </Link>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-hidden">
        <KanbanBoardConnected boardId="default" />
      </main>

      {/* Info Footer */}
      <footer className="border-t bg-muted/30 px-6 py-3 shrink-0">
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span>✨ Drag tasks between columns</span>
          <span>⚡ Changes reflect instantly (optimistic UI)</span>
          <span>🔄 Server sync on failure rollback</span>
        </div>
      </footer>
    </div>
  );
}
