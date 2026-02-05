import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>🔥 Forge</h1>
      <p>Wicked performant project management</p>
      <div style={{ marginTop: "2rem" }}>
        <h2>Features</h2>
        <ul>
          <li>⚡ LexoRank - O(1) card reordering</li>
          <li>🌲 Materialized Path - Instant subtree queries</li>
          <li>🔗 DAG - Dependency management with cycle detection</li>
          <li>🎯 Virtualized Kanban - Render 10k+ cards smoothly</li>
        </ul>
      </div>
    </div>
  );
}
