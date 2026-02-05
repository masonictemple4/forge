# Forge - Project TODO

## 🚨 Blockers (Must Fix Before Use)
- [x] Fix TanStack Start version compatibility issue (SSR exports) - Pinned to 1.120.17
- [x] Verify dev server runs cleanly (`pnpm dev`) ✅

## 🔧 Setup & Configuration
- [x] Create `.env.example` with all required variables
- [x] Document PostgreSQL setup requirements
- [x] Add database seeding script for demo data (25 tasks, 5 columns, dependencies)
- [x] Create Docker Compose for local Postgres
- [x] Add setup instructions to README
- [x] Add Makefile for common commands (setup, dev, seed, clean)
- [x] Verify all pnpm workspace packages link correctly

## 🎨 Branding
- [x] Logo v1 - Square & compass with all-seeing eye (rejected)
- [x] Logo v2 - Minimalist geometric (selected for refinement)
- [x] Logo v3 - Bold industrial anvil/hammer
- [x] Logo v4 - Abstract tech/data flow
- [ ] Logo v2 refined - Adding subtle Masonic symbolism (in progress)
- [ ] Create favicon versions for selected logo
- [ ] Add logo to app header

## ✅ Completed
- [x] TanStack Start + Hono + Drizzle scaffolding
- [x] LexoRank package (O(1) reordering) - 48 tests
- [x] DAG package (dependency management) - 45 tests
- [x] shadcn/ui components + Tailwind v4
- [x] Virtualized Kanban board (TanStack Virtual)
- [x] Drag-and-drop (dnd-kit)
- [x] TanStack Query setup + optimistic updates
- [x] Hono API routes (tasks, boards, dependencies)
- [x] Toast notifications
- [x] Status color scheme (todo/in-progress/done/blocked)

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
- **Repo:** https://github.com/masonictemple4/forge
- **Stress test route:** `/board/stress` (4,000 tasks)
- **Demo board:** `/board`
- **Status colors:** blue (todo), amber (in-progress), green (done), red (blocked)
- **Quick start:** `make setup && make seed && make dev`
