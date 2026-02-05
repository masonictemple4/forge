## Skills

A skill is a set of local instructions to follow that is stored in a `SKILL.md` file.

### Available skills

- forge-dashboard-delivery: Plan and deliver dashboard features from `docs/DASHBOARD_PROPOSAL.md` in phased, production-safe slices. (file: /Users/mason/personal/forge/.codex/skills/forge-dashboard-delivery/SKILL.md)
- forge-fullstack-contract-sync: Keep Drizzle schema, Hono endpoints, and TanStack Query/client types synchronized when contracts change. (file: /Users/mason/personal/forge/.codex/skills/forge-fullstack-contract-sync/SKILL.md)

### How to use skills

- Trigger rules: Use a skill when the user names it (`$skill-name`) or when the request clearly matches the skill description.
- Multiple skills: Use the minimal set that covers the request. For dashboard features that change schema/API shapes, use both skills in this order:
1. `$forge-dashboard-delivery`
2. `$forge-fullstack-contract-sync`
- Context hygiene: Prefer loading only the exact reference files needed from each skill.
- Fallback: If a skill path is missing or unreadable, state it briefly and continue with best-effort implementation.
