---
name: forge-dashboard-delivery
description: Plan and implement Forge dashboard features defined in docs/DASHBOARD_PROPOSAL.md, including board management, dashboard home, navigation, search, settings, and team flows. Use when a request asks for phase planning, backlog slicing, or delivery of any dashboard proposal item.
---

# Forge Dashboard Delivery

## Workflow

1. Map the request to the proposal.
- Read `references/phase-map.md`.
- Pick the smallest phase-appropriate slice that satisfies the ask.
- If the request spans multiple phases, deliver Phase 1/2 items first unless the user overrides.

2. Confirm current implementation baseline.
- Read `references/current-state.md`.
- Reuse existing task/column infrastructure where possible.
- Call out when proposal features depend on missing foundation tables or APIs.

3. Ship a vertical slice.
- Include route, API, and UI changes together.
- Add database changes only when required by the feature.
- Keep behavior behind existing navigation patterns unless the user asks for an IA change.

4. Validate before reporting.
- Run targeted checks first (`pnpm build` or focused type checks/tests if available).
- Verify request/response shapes match client query types.
- Report blockers and unresolved proposal open questions.

## Delivery Rules

- Prioritize P0 scope before P1/P2 scope.
- Keep output incremental; avoid broad rewrites across unrelated routes.
- For schema or endpoint changes, also apply `$forge-fullstack-contract-sync`.
