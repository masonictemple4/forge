# Forge 🔥

**Wicked performant project management** — an internal Jira/Trello alternative optimized for speed.

## Architecture

### Stack
- **Meta-Framework:** TanStack Start (SSR, streaming, full-stack type safety)
- **State & Caching:** TanStack Query (optimistic updates for 0ms latency perception)
- **Virtualization:** TanStack Virtual (render 10,000+ tickets without lag)
- **Backend:** Hono (faster than Express, runs anywhere)
- **Database:** PostgreSQL + Drizzle ORM (lightweight, closest to SQL)

### Key DSA Implementations

#### 1. Fractional Indexing (LexoRank)
- **Problem:** Moving a card in a list traditionally requires O(N) updates
- **Solution:** String-based ranking where inserting between 'a' and 'b' yields 'an'
- **Result:** O(1) card reordering — only the moved card is updated

#### 2. Hierarchical Data (Materialized Path)
- **Structure:** Epics → Stories → Subtasks
- **Implementation:** Store path like `/1/5/12/` for instant subtree queries
- **Query:** `WHERE path LIKE '/1/5/%'` with B-Tree index

#### 3. Dependency Graph (DAG)
- **Structure:** Directed Acyclic Graph for task dependencies
- **Algorithms:** 
  - Topological Sort (Kahn's) for dependency resolution
  - Cycle Detection (DFS) to prevent paradoxes
- **Auto-unblock:** When blocker moves to "Done", blocked tasks become ready

### Performance Optimizations

- **Virtualized Kanban:** Only render visible cards (~20) regardless of board size
- **Optimistic UI:** Instant visual feedback, background sync, automatic rollback on failure
- **GIN Index:** Full-text search without external engine (tsvector)

## Development

```bash
pnpm install
pnpm dev
```

## Project Structure

```
forge/
├── app/                    # TanStack Start app
│   ├── routes/            # File-based routing
│   └── components/        # UI components
├── server/                # Hono API
│   ├── routes/           # API endpoints
│   └── lib/              # Core logic
│       ├── lexorank.ts   # Fractional indexing
│       ├── dag.ts        # Dependency graph
│       └── path.ts       # Materialized path
├── db/                    # Drizzle schema & migrations
└── packages/              # Shared utilities
```

## License

MIT
