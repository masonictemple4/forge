import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <h1 className="text-4xl font-bold mb-2">🔥 Forge</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Wicked performant project management
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
        {/* API Board - NEW */}
        <Link
          to="/board/api"
          className="group block p-6 rounded-xl border-2 border-primary/50 bg-card hover:border-primary hover:shadow-lg transition-all"
        >
          <h2 className="text-xl font-semibold mb-2 group-hover:text-primary">
            🚀 Live Board (API)
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            Real database + Optimistic UI
          </p>
          <p className="text-xs text-muted-foreground">
            TanStack Query • Instant updates • Auto-rollback
          </p>
        </Link>

        {/* Board Demo */}
        <Link
          to="/board"
          className="group block p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
        >
          <h2 className="text-xl font-semibold mb-2 group-hover:text-primary">
            📋 Kanban Board
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            5 columns × 50 tasks = 250 tasks
          </p>
          <p className="text-xs text-muted-foreground">
            TanStack Virtual + dnd-kit drag-and-drop
          </p>
        </Link>

        {/* Stress Test */}
        <Link
          to="/board/stress"
          className="group block p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
        >
          <h2 className="text-xl font-semibold mb-2 group-hover:text-primary">
            ⚡ Stress Test
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            20 columns × 200 tasks = 4,000 tasks
          </p>
          <p className="text-xs text-muted-foreground">
            Renders ~20 items regardless of total count
          </p>
        </Link>
      </div>

      <div className="mt-12 max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          <li className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-medium">LexoRank</p>
              <p className="text-sm text-muted-foreground">O(1) card reordering</p>
            </div>
          </li>
          <li className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <span className="text-2xl">🌲</span>
            <div>
              <p className="font-medium">Materialized Path</p>
              <p className="text-sm text-muted-foreground">Instant subtree queries</p>
            </div>
          </li>
          <li className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <span className="text-2xl">🔗</span>
            <div>
              <p className="font-medium">DAG Dependencies</p>
              <p className="text-sm text-muted-foreground">Cycle detection built-in</p>
            </div>
          </li>
          <li className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-medium">Virtualized Kanban</p>
              <p className="text-sm text-muted-foreground">Render 10k+ cards smoothly</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
