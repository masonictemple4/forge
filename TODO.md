# Forge - Project TODO

## 🚨 Blockers (Must Fix Before Use)
- [x] Fix TanStack Start version compatibility issue (SSR exports) - Pinned to 1.120.17
- [x] Verify dev server runs cleanly (`pnpm dev`)

## 🔧 Setup & Configuration
- [x] Create `.env.example` with all required variables
- [x] Document PostgreSQL setup requirements
- [x] Add database seeding script for demo data
- [x] Create Docker Compose for local Postgres
- [x] Add setup instructions to README
- [x] Add Makefile for common commands
- [ ] Verify all pnpm workspace packages link correctly

## ✅ Completed
- [x] TanStack Start + Hono + Drizzle scaffolding
- [x] LexoRank package (O(1) reordering)
- [x] DAG package (dependency management)
- [x] shadcn/ui components + Tailwind v4
- [x] Virtualized Kanban board (TanStack Virtual)
- [x] Drag-and-drop (dnd-kit)
- [x] TanStack Query setup
- [x] Hono API routes (tasks, boards, dependencies)

## 🚀 Future Enhancements
- [ ] User authentication
- [ ] Real-time collaboration (WebSockets/SSE)
- [ ] Full-text search (PostgreSQL tsvector)
- [ ] Board/project management CRUD
- [ ] Task comments & activity log
- [ ] File attachments
- [ ] Keyboard shortcuts
- [ ] Mobile responsive design
- [ ] CRDT for collaborative text editing (Yjs)

## 📝 Notes
- Stress test route: `/board/stress` (4,000 tasks)
- Demo board: `/board`
- Status colors: blue (todo), amber (in-progress), green (done), red (blocked)
