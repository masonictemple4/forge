# Forge 🔥

**Wicked performant project management** — an internal Jira/Trello alternative optimized for speed.

## Quick Start

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **pnpm 10+** - `npm install -g pnpm`
- **Docker** - [Download](https://docs.docker.com/get-docker/)

### Setup

```bash
# Clone and enter directory
cd forge

# Copy environment variables
cp .env.example .env

# One-command setup (install deps, start Postgres, run migrations)
make setup

# Seed demo data (optional)
make seed

# Start development server
make dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

### Manual Setup (without Make)

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Push database schema
pnpm db:push

# Seed demo data (optional)
pnpm db:seed

# Start dev server
pnpm dev
```

## Available Commands

### Make Commands

| Command | Description |
|---------|-------------|
| `make setup` | Install deps, start Docker, run migrations |
| `make dev` | Start development server |
| `make seed` | Seed database with demo data |
| `make clean` | Stop Docker, remove node_modules |
| `make db-start` | Start PostgreSQL container |
| `make db-stop` | Stop PostgreSQL container |
| `make db-reset` | Reset database (drop & recreate) |
| `make db-studio` | Open Drizzle Studio |
| `make build` | Build for production |
| `make typecheck` | Run TypeScript type checking |

### npm Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Seed demo data |

## Project Structure

```
forge/
├── app/                    # TanStack Start app
│   ├── routes/            # File-based routing
│   ├── components/        # UI components
│   │   ├── ui/           # shadcn/ui components
│   │   └── board/        # Kanban board components
│   └── lib/              # Client utilities
│       └── query/        # TanStack Query hooks
├── server/                # Hono API
│   ├── routes/           # API endpoints
│   └── lib/              # Core logic
├── db/                    # Drizzle ORM
│   ├── schema.ts         # Database schema
│   ├── index.ts          # Database client
│   └── migrations/       # Migration files
├── packages/              # Shared libraries
│   ├── lexorank/         # Fractional indexing (O(1) reorder)
│   └── dag/              # Dependency graph (DAG)
├── scripts/               # Utility scripts
│   └── seed.ts           # Database seeding
├── docker-compose.yml     # PostgreSQL container
├── drizzle.config.ts      # Drizzle configuration
└── app.config.ts          # TanStack Start config
```

## Architecture

### Tech Stack

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

## Demo Routes

- `/board` - Main Kanban board with demo data
- `/board/stress` - Stress test with 4,000 tasks

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

## Troubleshooting

### Port 5432 already in use

```bash
# Check what's using the port
lsof -i :5432

# Or use a different port in docker-compose.yml
```

### Database connection refused

```bash
# Make sure Docker is running
docker compose ps

# Check logs
docker compose logs postgres

# Restart the container
make db-reset
```

### Migrations not applying

```bash
# Force push schema (development only)
pnpm db:push --force
```

## License

MIT
