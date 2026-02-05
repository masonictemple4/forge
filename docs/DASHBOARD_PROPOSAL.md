# Forge Dashboard - Project Management Proposal

**Version:** 2.0  
**Date:** February 2025  
**Status:** Draft - Pending Review

---

## Overview

This proposal defines the dashboard experience for Forge, focused on **project management workflows** rather than analytics. The dashboard is the central hub for managing boards, settings, and navigation—everything users need to organize their work.

---

## 1. Board Management

The core of Forge is boards. Users need full control over creating, organizing, and managing their boards.

### 1.1 Board List View

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Grid View** | Visual cards showing board name, thumbnail, last updated | P0 | Low |
| **List View** | Compact table view with sortable columns | P0 | Low |
| **View Toggle** | Switch between grid/list, persist preference | P0 | Low |
| **Sort Options** | By name, last updated, created date, task count | P1 | Low |
| **Filter by Status** | Active, Archived, All | P1 | Low |

### 1.2 Create Board

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **New Board Button** | Prominent "+" button, always visible | P0 | Low |
| **Board Name** | Required field, auto-focus on open | P0 | Low |
| **Description** | Optional rich text description | P1 | Low |
| **Template Selection** | Choose from starter templates | P1 | Med |
| **Initial Columns** | Pre-populate with selected template columns | P1 | Med |

### 1.3 Edit Board

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Rename Board** | Inline edit or modal | P0 | Low |
| **Edit Description** | Update board description | P0 | Low |
| **Board Settings** | Default assignee, WIP limits, colors | P1 | Med |
| **Change Template** | Reset columns to different template (with warning) | P2 | Med |

### 1.4 Delete Board

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Delete Button** | In board settings or context menu | P0 | Low |
| **Confirmation Modal** | Type board name to confirm (destructive action) | P0 | Low |
| **Cascade Warning** | Show task count that will be deleted | P0 | Low |

### 1.5 Board Templates

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Kanban Template** | Backlog → Todo → In Progress → Done | P0 | Low |
| **Simple Template** | Todo → Doing → Done | P0 | Low |
| **Scrum Template** | Backlog → Sprint → In Progress → Review → Done | P1 | Low |
| **Bug Tracking** | New → Confirmed → In Progress → Fixed → Verified | P1 | Low |
| **Custom Template** | Save current board as template | P2 | Med |

### 1.6 Archive/Restore

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Archive Board** | Move to archived state, hide from default view | P1 | Low |
| **View Archived** | Filter to see archived boards | P1 | Low |
| **Restore Board** | Unarchive, return to active state | P1 | Low |
| **Permanent Delete** | Option to delete archived boards | P2 | Low |

---

## 2. User Settings

Personal preferences and account management.

### 2.1 Profile Settings

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Display Name** | User's visible name across the app | P0 | Low |
| **Avatar** | Upload or Gravatar integration | P1 | Med |
| **Email** | Primary email (read-only if OAuth) | P0 | Low |
| **Change Password** | For email/password auth users | P1 | Med |

### 2.2 Notification Preferences

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Email Notifications** | Toggle: task assigned, mentions, due dates | P1 | Med |
| **In-App Notifications** | Toggle notification types | P1 | Med |
| **Quiet Hours** | Set times to suppress notifications | P2 | Med |
| **Per-Board Settings** | Override notification settings per board | P2 | High |

### 2.3 Theme

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Light Mode** | Default light theme | P0 | Low |
| **Dark Mode** | Dark theme option | P0 | Low |
| **System Default** | Follow OS preference | P0 | Low |
| **Accent Color** | Customize primary color (future) | P2 | Med |

### 2.4 Keyboard Shortcuts

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **View Shortcuts** | Modal showing all available shortcuts | P1 | Low |
| **Customize Shortcuts** | Remap keys to different actions | P2 | High |
| **Enable/Disable** | Master toggle for keyboard shortcuts | P1 | Low |

### 2.5 Default Board

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Set Default** | Choose which board opens on login | P1 | Low |
| **Homepage Option** | Option: dashboard vs. default board on login | P1 | Low |

---

## 3. Team Settings

For team owners and admins to manage their workspace.

### 3.1 Team Profile

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Team Name** | Editable team name | P1 | Low |
| **Team Description** | About/purpose of the team | P1 | Low |
| **Team Avatar/Logo** | Visual identifier | P2 | Med |

### 3.2 Member Management

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Member List** | Table of all team members | P0 | Low |
| **Invite by Email** | Send email invitation to join | P0 | Med |
| **Invite Link** | Shareable link to join team | P1 | Med |
| **Remove Member** | Remove from team (with confirmation) | P0 | Low |
| **Leave Team** | Self-remove from team | P1 | Low |

### 3.3 Role Management

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Admin Role** | Full access: manage members, settings, all boards | P0 | Low |
| **Member Role** | Create/edit boards and tasks | P0 | Low |
| **Viewer Role** | Read-only access to boards | P1 | Med |
| **Change Role** | Admin can change member roles | P0 | Low |
| **Transfer Ownership** | Transfer team owner status | P1 | Med |

### 3.4 Team-Wide Defaults

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Default Template** | Template used when members create boards | P2 | Low |
| **Default WIP Limits** | Suggest WIP limits for new boards | P2 | Low |
| **Enforced Settings** | Require certain settings on all boards | P2 | Med |

---

## 4. Global Search

Find anything, anywhere, fast. The most powerful navigation tool.

### 4.1 Search Scope

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Search All Boards** | Search across every board user has access to | P0 | Med |
| **Search Tasks** | Find tasks by title and description | P0 | Med |
| **Search Boards** | Find boards by name | P0 | Low |
| **Search Members** | Find team members (for filtering) | P1 | Low |

### 4.2 Filters

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Filter by Status** | Todo, In Progress, Done, etc. | P0 | Med |
| **Filter by Assignee** | Tasks assigned to specific person | P0 | Med |
| **Filter by Date** | Due date range, created date range | P1 | Med |
| **Filter by Board** | Narrow search to specific board(s) | P1 | Low |
| **Filter by Labels** | Search by task labels/tags | P1 | Med |

### 4.3 Search UX

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Cmd+K Modal** | Quick search overlay, keyboard accessible | P0 | Med |
| **Instant Results** | Results as you type (debounced) | P0 | Med |
| **Recent Searches** | Show last 5-10 search queries | P1 | Low |
| **Keyboard Navigation** | Arrow keys to navigate, Enter to select | P0 | Low |
| **Result Preview** | Show task snippet in results | P1 | Med |

### 4.4 Search Results

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Grouped Results** | Group by type: Boards, Tasks, People | P1 | Med |
| **Highlight Matches** | Bold matching text in results | P1 | Low |
| **Direct Navigation** | Click result → go to item | P0 | Low |
| **Open in New Tab** | Cmd+Click to open in new tab | P1 | Low |

---

## 5. Navigation & Structure

The information architecture that ties everything together.

### 5.1 Sidebar

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Boards List** | All boards, expandable/collapsible | P0 | Low |
| **Starred Boards** | Pinned/favorite boards at top | P0 | Low |
| **Recent Boards** | Last 5 boards visited | P1 | Low |
| **Create Board Button** | Quick access in sidebar | P0 | Low |
| **Collapse Sidebar** | Toggle to minimize sidebar | P1 | Low |
| **Drag to Reorder** | Reorder boards in sidebar | P2 | Med |

### 5.2 Workspace Switcher

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Current Workspace** | Show active team/workspace name | P1 | Low |
| **Switch Workspace** | Dropdown to change teams | P1 | Med |
| **Personal Workspace** | User's private boards (no team) | P1 | Low |
| **Create Team** | Quick action to create new team | P2 | Med |

### 5.3 Breadcrumbs

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Location Trail** | Home > Board > Task | P1 | Low |
| **Clickable Crumbs** | Navigate up the hierarchy | P1 | Low |
| **Truncate Long Names** | Ellipsis for long board/task names | P1 | Low |

### 5.4 Quick Board Switcher

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Keyboard Shortcut** | `Cmd+Shift+B` to open switcher | P1 | Low |
| **Fuzzy Search** | Type to filter boards | P1 | Med |
| **Recent First** | Show recent boards at top | P1 | Low |

---

## 6. Home/Dashboard View

The landing page when users open Forge. At-a-glance overview of their work.

### 6.1 Recent Boards

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Recent Board Cards** | Last 4-6 boards, visual cards | P0 | Low |
| **Last Updated Time** | "Updated 2 hours ago" | P0 | Low |
| **Quick Open** | Click to go to board | P0 | Low |
| **Task Count Preview** | Show open task count per board | P1 | Low |

### 6.2 Recent Tasks

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Recently Viewed** | Last 5-10 tasks user opened | P1 | Low |
| **Recently Updated** | Tasks with recent changes | P1 | Low |
| **Quick Edit** | Inline status change from list | P2 | Med |

### 6.3 Assigned to Me

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **My Tasks List** | All tasks assigned to current user | P0 | Med |
| **Cross-Board** | Aggregate from all accessible boards | P0 | Med |
| **Group by Board** | Option to group tasks by their board | P1 | Low |
| **Group by Status** | Option to group by task status | P1 | Low |
| **Sort by Due Date** | Surface urgent tasks first | P0 | Low |
| **Overdue Highlight** | Red indicator for past-due tasks | P0 | Low |

### 6.4 Starred/Favorite Boards

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| **Star a Board** | Click star icon to favorite | P0 | Low |
| **Starred Section** | Dedicated area for starred boards | P0 | Low |
| **Unstar** | Remove from favorites | P0 | Low |
| **Drag to Reorder** | Order starred boards | P2 | Med |

---

## 7. Wireframes

### 7.1 Main Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────┐                                                    🔍 Cmd+K    │
│  │  FORGE  │            Home                              [Avatar] Settings │
├──┴─────────┴────────────────────────────────────────────────────────────────┤
│  │           │                                                              │
│  │  ★ STARRED│   ┌─────────────────────────────────────────────────────┐   │
│  │   Board A │   │                                                     │   │
│  │   Board B │   │   Good morning, Mason                               │   │
│  │           │   │                                                     │   │
│  │  RECENT   │   │   ┌────────────────── RECENT BOARDS ─────────────┐ │   │
│  │   Board C │   │   │                                               │ │   │
│  │   Board D │   │   │  ┌─────────┐  ┌─────────┐  ┌─────────┐       │ │   │
│  │   Board E │   │   │  │ Board A │  │ Board C │  │ Board D │ [+]   │ │   │
│  │           │   │   │  │ 12 tasks│  │ 8 tasks │  │ 3 tasks │       │ │   │
│  ├───────────┤   │   │  │ 2h ago  │  │ 1d ago  │  │ 3d ago  │       │ │   │
│  │           │   │   │  └─────────┘  └─────────┘  └─────────┘       │ │   │
│  │  BOARDS   │   │   │                                               │ │   │
│  │   + New   │   │   └───────────────────────────────────────────────┘ │   │
│  │   Board A │   │                                                     │   │
│  │   Board B │   │   ┌────────────── ASSIGNED TO ME ────────────────┐ │   │
│  │   Board C │   │   │                                               │ │   │
│  │   Board D │   │   │  ☐ Fix login bug           Board A   Due: Today│ │   │
│  │   Board E │   │   │  ☐ Update documentation    Board B   Due: Fri │ │   │
│  │   Board F │   │   │  ☐ Review PR #42           Board A   No date  │ │   │
│  │           │   │   │  ☐ Design new feature      Board C   Due: Mon │ │   │
│  ├───────────┤   │   │                                               │ │   │
│  │           │   │   │  [View all 12 tasks →]                        │ │   │
│  │  TEAMS    │   │   │                                               │ │   │
│  │   Team 1 ▾│   │   └───────────────────────────────────────────────┘ │   │
│  │   Personal│   │                                                     │   │
│  │           │   └─────────────────────────────────────────────────────┘   │
│  │           │                                                              │
│  └───────────┘                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Board List View (Grid Mode)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Boards                           [Grid │ List]    Sort: Recent ▾   [+ New] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ ★               │  │                 │  │ ★               │              │
│  │                 │  │                 │  │                 │              │
│  │  ░░░░░░░░░░░░  │  │  ░░░░░░░░░░░░  │  │  ░░░░░░░░░░░░  │              │
│  │  ░░░░░░░░░░░░  │  │  ░░░░░░░░░░░░  │  │  ░░░░░░░░░░░░  │              │
│  │                 │  │                 │  │                 │              │
│  │  Product Dev    │  │  Marketing      │  │  Bug Tracker    │              │
│  │  24 tasks       │  │  12 tasks       │  │  8 tasks        │              │
│  │  Updated 2h ago │  │  Updated 1d ago │  │  Updated 3h ago │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │                 │  │                 │  │                 │              │
│  │                 │  │                 │  │                 │              │
│  │  ░░░░░░░░░░░░  │  │  ░░░░░░░░░░░░  │  │       +         │              │
│  │  ░░░░░░░░░░░░  │  │  ░░░░░░░░░░░░  │  │                 │              │
│  │                 │  │                 │  │   Create New    │              │
│  │  Sprint 23      │  │  Design System  │  │     Board       │              │
│  │  18 tasks       │  │  6 tasks        │  │                 │              │
│  │  Updated 5d ago │  │  Updated 1w ago │  │                 │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Cmd+K Search Modal

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│         ┌────────────────────────────────────────────────────────┐          │
│         │ 🔍  Search boards, tasks, and more...          ⌘K     │          │
│         ├────────────────────────────────────────────────────────┤          │
│         │                                                        │          │
│         │  RECENT SEARCHES                                       │          │
│         │    🕐  login bug                                       │          │
│         │    🕐  API documentation                               │          │
│         │    🕐  design review                                   │          │
│         │                                                        │          │
│         │  SUGGESTED                                             │          │
│         │    📋  Product Dev                         Board       │          │
│         │    📋  Marketing                           Board       │          │
│         │    ☐  Fix login bug                        Task        │          │
│         │                                                        │          │
│         │  ────────────────────────────────────────────────────  │          │
│         │                                                        │          │
│         │  ↑↓ Navigate   ⏎ Open   ⇧⏎ Open in new tab   esc Close│          │
│         └────────────────────────────────────────────────────────┘          │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 User Settings Page

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                        [← Back]   │
├──────────────────────────────────────────────────────────────────────────────┤
│  │               │                                                          │
│  │  ACCOUNT      │    Profile                                               │
│  │   Profile     │    ─────────────────────────────────────────────────     │
│  │   Password    │                                                          │
│  │               │    ┌──────┐                                              │
│  │  PREFERENCES  │    │ 🧑  │   Display Name                               │
│  │   Theme       │    │      │   ┌──────────────────────────────────┐       │
│  │   Notifs      │    └──────┘   │ Mason                            │       │
│  │   Shortcuts   │    [Change]   └──────────────────────────────────┘       │
│  │   Defaults    │                                                          │
│  │               │               Email                                      │
│  │  TEAM         │               ┌──────────────────────────────────┐       │
│  │   Members     │               │ mason@example.com                │       │
│  │   Settings    │               └──────────────────────────────────┘       │
│  │   Billing     │                                                          │
│  │               │               ┌──────────────────────────────────────┐   │
│  │               │               │           Save Changes               │   │
│  │               │               └──────────────────────────────────────┘   │
│  │               │                                                          │
│  └───────────────┘                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Team Member Management

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Team Settings > Members                               [+ Invite Member]    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Member              │  Email                    │  Role    │  Actions │ │
│  ├──────────────────────┼───────────────────────────┼──────────┼──────────┤ │
│  │  🧑 Mason (you)      │  mason@example.com        │  Owner   │          │ │
│  │  🧑 Alex Johnson     │  alex@example.com         │  Admin ▾ │  ⋮       │ │
│  │  🧑 Sam Williams     │  sam@example.com          │  Member▾ │  ⋮       │ │
│  │  🧑 Jordan Lee       │  jordan@example.com       │  Viewer▾ │  ⋮       │ │
│  └──────────────────────┴───────────────────────────┴──────────┴──────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  PENDING INVITATIONS                                                   │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  📧 chris@example.com       Invited 2 days ago       [Resend] [Cancel] │ │
│  │  📧 pat@example.com         Invited 5 days ago       [Resend] [Cancel] │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Invite Link: https://forge.app/join/abc123             [Copy] [Regenerate]│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Keyboard Shortcuts

| Shortcut | Action | Priority |
|----------|--------|----------|
| `Cmd/Ctrl + K` | Open global search | P0 |
| `Cmd/Ctrl + Shift + B` | Quick board switcher | P1 |
| `C` | Create new task (when on board) | P0 |
| `N` | Create new board (when on dashboard) | P1 |
| `G` then `H` | Go to Home/Dashboard | P1 |
| `G` then `B` | Go to Boards list | P1 |
| `G` then `S` | Go to Settings | P1 |
| `/` | Focus search in current context | P1 |
| `?` | Show keyboard shortcuts help | P1 |
| `Esc` | Close modal/cancel action | P0 |

---

## 9. Implementation Phases

### Phase 1: Core Navigation (P0)
**Timeline:** 1 week

- [ ] Sidebar with boards list
- [ ] Home dashboard route
- [ ] Recent boards section
- [ ] Starred boards functionality
- [ ] Create new board flow
- [ ] Basic board list (grid view)

### Phase 2: Search & Settings (P0-P1)
**Timeline:** 1-2 weeks

- [ ] Cmd+K search modal
- [ ] Search across boards and tasks
- [ ] User settings page (profile, theme)
- [ ] Board edit/delete functionality
- [ ] Board templates (basic set)

### Phase 3: Team & Polish (P1-P2)
**Timeline:** 1-2 weeks

- [ ] Team settings page
- [ ] Member management (invite, remove, roles)
- [ ] Notification preferences
- [ ] "Assigned to Me" cross-board view
- [ ] List view for boards
- [ ] Archive/restore boards

### Phase 4: Advanced Features (P2)
**Timeline:** Backlog

- [ ] Custom keyboard shortcuts
- [ ] Workspace/team switcher
- [ ] Drag-to-reorder sidebar items
- [ ] Custom board templates
- [ ] Per-board notification settings

---

## 10. Database Changes

### New Tables

```sql
-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'system',
  default_board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  homepage VARCHAR(20) DEFAULT 'dashboard',
  keyboard_shortcuts_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Starred boards (many-to-many)
CREATE TABLE starred_boards (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  starred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, board_id)
);

-- Recent board visits (for "recent boards" feature)
CREATE TABLE board_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX board_visits_user_recent ON board_visits(user_id, visited_at DESC);

-- Team members and roles
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Team invitations
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);
```

### Schema Changes

```sql
-- Add to boards table
ALTER TABLE boards ADD COLUMN archived_at TIMESTAMPTZ;
ALTER TABLE boards ADD COLUMN template_id UUID REFERENCES board_templates(id);

-- Add to tasks table (if not exists)
ALTER TABLE tasks ADD COLUMN assignee_id UUID REFERENCES users(id);

-- Board templates
CREATE TABLE board_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  columns JSONB NOT NULL, -- [{name: "Todo", color: "#..."}, ...]
  is_system BOOLEAN DEFAULT false, -- built-in vs user-created
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 11. API Endpoints

| Endpoint | Method | Description | Phase |
|----------|--------|-------------|-------|
| `GET /api/boards` | GET | List all boards (with filters) | Phase 1 |
| `POST /api/boards` | POST | Create new board | Phase 1 |
| `PATCH /api/boards/:id` | PATCH | Update board | Phase 2 |
| `DELETE /api/boards/:id` | DELETE | Delete board | Phase 2 |
| `POST /api/boards/:id/archive` | POST | Archive board | Phase 3 |
| `POST /api/boards/:id/restore` | POST | Restore board | Phase 3 |
| `GET /api/boards/starred` | GET | Get starred boards | Phase 1 |
| `POST /api/boards/:id/star` | POST | Star a board | Phase 1 |
| `DELETE /api/boards/:id/star` | DELETE | Unstar a board | Phase 1 |
| `GET /api/boards/recent` | GET | Get recent boards | Phase 1 |
| `GET /api/search` | GET | Global search | Phase 2 |
| `GET /api/user/preferences` | GET | Get user preferences | Phase 2 |
| `PATCH /api/user/preferences` | PATCH | Update preferences | Phase 2 |
| `GET /api/tasks/assigned` | GET | Tasks assigned to current user | Phase 3 |
| `GET /api/teams/:id/members` | GET | List team members | Phase 3 |
| `POST /api/teams/:id/invite` | POST | Invite member | Phase 3 |
| `DELETE /api/teams/:id/members/:userId` | DELETE | Remove member | Phase 3 |
| `PATCH /api/teams/:id/members/:userId` | PATCH | Update member role | Phase 3 |
| `GET /api/templates` | GET | List board templates | Phase 2 |

---

## 12. Open Questions

1. **Search Backend:** Use PostgreSQL full-text search, or integrate a dedicated search service (MeiliSearch, Typesense)?

2. **Real-time Updates:** Should the sidebar reflect board changes in real-time (WebSocket), or on refresh?

3. **Teams vs. Workspaces:** Should we call them "teams" or "workspaces"? Teams implies people, workspaces implies organization.

4. **Guest Access:** Should viewers have their own invite flow, or are they just team members with restricted role?

5. **Board Thumbnails:** Generate actual miniature preview of board state, or use abstract colored patterns?

---

## 13. Component Structure

```
<DashboardLayout>
  ├── <Sidebar>
  │   ├── <Logo />
  │   ├── <StarredBoards />
  │   ├── <RecentBoards />
  │   ├── <BoardsList />
  │   │   └── <BoardItem />*
  │   ├── <CreateBoardButton />
  │   └── <TeamSwitcher />
  │
  ├── <TopBar>
  │   ├── <Breadcrumbs />
  │   ├── <GlobalSearch />
  │   └── <UserMenu />
  │
  └── <MainContent>
      ├── <HomePage> (default)
      │   ├── <RecentBoardsGrid />
      │   └── <AssignedToMe />
      │
      ├── <BoardsPage>
      │   ├── <ViewToggle />
      │   ├── <BoardGrid /> or <BoardList />
      │   └── <CreateBoardCard />
      │
      └── <SettingsPage>
          ├── <SettingsSidebar />
          └── <SettingsContent />
              ├── <ProfileSettings />
              ├── <ThemeSettings />
              ├── <NotificationSettings />
              └── <TeamSettings />

<SearchModal /> (portal, triggered by Cmd+K)
<CreateBoardModal /> (portal)
<ConfirmDeleteModal /> (portal)
```

---

*End of Proposal*
