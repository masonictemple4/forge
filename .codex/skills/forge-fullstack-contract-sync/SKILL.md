---
name: forge-fullstack-contract-sync
description: Keep Forge full-stack contracts consistent across Drizzle schema, Hono routes, and TanStack Query client types. Use when adding or changing database fields, API endpoints, request payloads, response shapes, or query hooks.
---

# Forge Fullstack Contract Sync

## Workflow

1. Define the contract delta.
- State exactly what is changing in request, response, and persistence layers.
- Identify whether the change is additive, breaking, or behavior-only.

2. Update persistence first.
- Edit `db/schema.ts`.
- Generate migration files in `db/migrations/` when schema changes.
- Keep indexes and relations aligned with query patterns.

3. Update server contracts.
- Add or adjust route handlers in `server/routes/`.
- Validate payloads using zod in route schemas.
- Return stable JSON shapes and explicit status codes.

4. Update client contracts.
- Update `app/lib/query/types.ts` and relevant query hooks.
- Ensure optimistic update logic still matches server response fields.
- Wire new route usage in consuming components/routes.

5. Validate integration.
- Run targeted checks (`pnpm build`, and any feature-specific tests available).
- Confirm no stale field names remain (`rg` for renamed keys).

## Guardrails

- Avoid schema changes without corresponding API and query-layer updates.
- Prefer additive API changes unless user requests breaking cleanup.
- If a feature touches dashboard proposal scope, also apply `$forge-dashboard-delivery`.
