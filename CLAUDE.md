# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forge is a high-performance project management app (Kanban board) built as a full-stack TypeScript monorepo. TanStack Start (via vinxi/Vite) for the frontend, Hono for the API, Drizzle ORM with PostgreSQL, pnpm workspaces.

## Commands

### Development
```bash
make setup          # Full setup: pnpm install + Docker Postgres + db:push
pnpm dev            # Start dev server (vinxi dev)
make typecheck      # tsc --noEmit (only code quality gate — no linter configured)
```

### Database
```bash
make db-start       # Start Postgres container
make db-stop        # Stop Postgres container
make db-reset       # Drop and recreate database, re-push schema
pnpm db:generate    # Generate Drizzle migrations
pnpm db:migrate     # Run Drizzle migrations
pnpm db:push        # Push schema directly (dev)
pnpm db:studio      # Open Drizzle Studio
pnpm db:seed        # Seed database (25 tasks + 6 dependencies)
```

### Tests
```bash
cd packages/lexorank && pnpm test    # Run lexorank tests (vitest, 48 tests)
cd packages/dag && pnpm test         # Run DAG tests (vitest, 45 tests)
```
No app-level or E2E tests exist. Tests only live in workspace packages.

### Build & Deploy
```bash
pnpm build          # Production build (vinxi build)
pnpm start          # Start production server
```
Vercel deployment configured — preset auto-switches when `process.env.VERCEL` is set.

## Architecture

### Path Aliases (tsconfig.json)
- `~/*` → `./app/*`
- `@server/*` → `./server/*`
- `@db/*` → `./db/*`
- `@forge/lexorank` → `./packages/lexorank/src/index.ts`
- `@forge/dag` → `./packages/dag/src/index.ts`

### Data Flow
```
React Component → TanStack Query hook (app/lib/query/) → fetch(/api/*) → Hono route (server/routes/) → Drizzle → PostgreSQL
```

### Frontend (app/)
- **Routing:** TanStack Router with file-based routes in `app/routes/`. Dot-notation for nesting (`board.stress.tsx` → `/board/stress`). Route tree auto-generated in `routeTree.gen.ts` — never edit manually.
- **State/caching:** TanStack Query. All hooks in `app/lib/query/` with centralized query key factory in `client.ts`.
- **Optimistic updates:** Every mutation hook follows snapshot → optimistic apply → rollback on error → invalidate on settle.
- **Virtualization:** TanStack Virtual for card lists within columns. First 5 items rendered statically for SSR, then switches to virtualized after hydration. Overscan of 5.
- **Drag & drop:** dnd-kit with `PointerSensor` + `KeyboardSensor`, `closestCorners` collision detection. Supports same-column reorder and cross-column move.
- **UI components:** shadcn/ui (new-york style, zinc base) in `app/components/ui/`. Uses `cn()` from `app/lib/utils.ts`.
- **Styling:** Tailwind CSS v4 with oklch color variables defined in `app/styles.css`.

### Backend (server/)
- **Hono** app created in `server/index.ts`, mounted into TanStack Start via `app/api.ts`.
- Routes: `tasks.ts`, `boards.ts`, `columns.ts`, `dependencies.ts`, `auth.ts` — all under `/api/*` or `/auth/*`.
- Request validation: `@hono/zod-validator` with Zod schemas.

### Database (db/)
- **5 tables:** users, sessions, tasks, dependencies, columns (schema in `db/schema.ts`).
- Tasks use **LexoRank** for ordering and **materialized paths** for hierarchy.
- Full-text search via `tsvector` column with GIN index.
- Dependencies form a DAG (blocker_id, blocked_id composite PK).

### Workspace Packages (packages/)
- **@forge/lexorank:** Fractional indexing library (base-66 charset). Used by client-side board components.
- **@forge/dag:** In-memory dependency graph with cycle detection and topological sort.

Note: Server has its own simpler LexoRank (base-26, `server/lib/lexorank.ts`) and DAG (`server/lib/dag.ts`, DB-backed) implementations separate from the packages.

### Auth (server/routes/auth.ts)
Self-implemented — no auth libraries. Email/password (argon2id + JWT) and OAuth (GitHub, Google, Apple). Sessions stored in DB with HTTP-only cookies.

### Board Routes
- `/board` — Mock data, no API (in-memory)
- `/board/api` — Real API with optimistic updates
- `/board/stress` — Performance stress test (4000 tasks)

## Key Constraints

- **pnpm only.** Workspaces configured via `pnpm-workspace.yaml`.
- **TanStack versions pinned** to `1.120.17` via pnpm overrides for compatibility.
- **No linter or formatter configured.** `make typecheck` is the only static analysis.
- **Environment variables:** Copy `.env.example` to `.env`. Required: `DATABASE_URL`, `JWT_SECRET`, `BASE_URL`. OAuth vars needed only for OAuth flows.
