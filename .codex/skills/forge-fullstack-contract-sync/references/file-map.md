# Forge Fullstack File Map

## Persistence

- `db/schema.ts`: source of truth for tables, relations, and indexes
- `db/migrations/`: generated and manual SQL migrations
- `db/index.ts`: exported schema/db wiring

## Server API

- `server/index.ts`: route registration
- `server/routes/*.ts`: endpoint handlers and zod validators
- `server/lib/*.ts`: shared helpers (LexoRank, DAG, path utilities)

## Client Query Layer

- `app/lib/query/types.ts`: shared request/response model interfaces
- `app/lib/query/*.ts`: fetch/mutation hooks and optimistic updates
- `app/routes/*.tsx`: route-level composition and data usage
- `app/components/board/*.tsx`: board/task UI behavior

## Common Change Sequence

1. Schema + migration
2. Server route contract
3. Query types/hooks
4. Route/component wiring
5. Build/type validation
