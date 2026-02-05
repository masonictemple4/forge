# Forge - Project TODO

## 🚨 In Progress
- [ ] Task detail view (click to open modal/drawer)
- [ ] Add new tasks (UI + API)
- [ ] Edit tasks (inline or modal)
- [ ] Delete tasks (with confirmation)
- [ ] Reorder columns (drag & drop)
- [ ] Rename columns (inline edit)
- [x] Fix cross-column drag animation (match in-column animation)
- [x] Landing page (marketing/hero) - Hero, features, CTAs, responsive design
- [x] Login page - GitHub, Google, Apple OAuth buttons (UI only)
- [ ] Auth: GitHub OAuth (self-implemented)
- [ ] Auth: Google OAuth (self-implemented)
- [ ] Auth: Apple OAuth (self-implemented)
- [ ] User sessions & JWT handling
- [ ] Email/password auth with registration

## ✅ Completed
- [x] Migrate from @tanstack/start to @tanstack/react-start (deprecation warning fixed)
- [x] Add notFoundComponent to router config - Created NotFound component
- [x] Fix TanStack Start version compatibility issue - Pinned to 1.120.17
- [x] Verify dev server runs cleanly (`pnpm dev`)
- [x] Create `.env.example` with all required variables
- [x] Document PostgreSQL setup requirements
- [x] Add database seeding script for demo data
- [x] Create Docker Compose for local Postgres
- [x] Add setup instructions to README
- [x] Add Makefile for common commands
- [x] Verify all pnpm workspace packages link correctly
- [x] TanStack Start + Hono + Drizzle scaffolding
- [x] LexoRank package (O(1) reordering) - 48 tests
- [x] DAG package (dependency management) - 45 tests
- [x] shadcn/ui components + Tailwind v4
- [x] Virtualized Kanban board (TanStack Virtual)
- [x] Drag-and-drop (dnd-kit)
- [x] TanStack Query setup + optimistic updates
- [x] Hono API routes (tasks, boards, dependencies)
- [x] Toast notifications
- [x] Status color scheme
- [x] Logo design
- [x] Add dotenv for env loading

## 🚀 Future Enhancements
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
- **Quick start:** `make setup && make seed && make dev`
