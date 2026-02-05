# Dashboard Proposal Phase Map

Source: `docs/DASHBOARD_PROPOSAL.md`

## Phase 1 (P0, 1 week)

- Sidebar with boards list
- Home dashboard route
- Recent boards section
- Starred boards functionality
- Create board flow
- Basic board list (grid)

## Phase 2 (P0-P1, 1-2 weeks)

- Cmd+K search modal
- Search across boards and tasks
- User settings page (profile/theme)
- Board edit/delete
- Board templates (basic)

## Phase 3 (P1-P2, 1-2 weeks)

- Team settings page
- Member management (invite/remove/roles)
- Notification preferences
- Assigned to Me cross-board view
- Board list view (table)
- Archive and restore boards

## Phase 4 (P2, backlog)

- Custom keyboard shortcuts
- Workspace switcher
- Drag-to-reorder sidebar items
- Custom board templates
- Per-board notification settings

## Dependency Notes

- Board-first data model is required before most dashboard views:
`boards`, `board_templates`, `starred_boards`, `board_visits`, and `user_preferences`.
- Cross-board features (search, Assigned to Me, starred/recent) need board identity in task/column queries.
- Team settings work depends on `teams`, `team_members`, and invitation endpoints.
