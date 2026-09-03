# Prove Swappable Infrastructure Milestone — Arc: SQL Adapter (PRs 10–11)

**Previous:** [`queue-adapter.md`](./queue-adapter.md) (PRs 4–9)

Part of the [`MILESTONE.md`](../MILESTONE.md) PR log, split out to keep that doc scannable. Builds a Postgres adapter via Prisma, replacing SQLite, and wires it into `packages/runtime`'s config selection.

## PR 10 - Postgres adapter (Prisma) - not started

### Discussion

- **Client-side change expected to be small.** `packages/db-prisma/src/client.ts` already uses Prisma's driver-adapter architecture (`@prisma/adapter-better-sqlite3` → `new PrismaClient({ adapter })`) — swapping to Postgres means swapping in `@prisma/adapter-pg` with a connection string, same shape, not a rewrite. `schema.prisma` itself has no SQLite-specific workarounds (real `enum` blocks, no `@db.*` native-type pins, no JSON-as-string hacks), and a repo-wide grep found zero `$queryRaw`/`$executeRaw` or SQLite-specific SQL outside the generated client — everything goes through Prisma's provider-agnostic query builder.
- **The real friction is migrations, not code.** `schema.prisma`'s `datasource.provider` is one static value tied to one `prisma/migrations/` folder of SQLite-flavored SQL, and that history doesn't carry over to Postgres. Decided: when this lands, the existing SQLite migration history collapses/resets rather than being preserved — a fresh migration history for Postgres, not two parallel histories kept in sync.

## PR 11 - Extend the `local-system` profile with the `postgres` SQL branch - not started

### Discussion

- Expected to be a comparatively mechanical repeat of PR 3's config-selection pattern (see `cas-adapter.md`), applied to the SQL/database choice — adds a real `postgres` branch to `local-system`'s existing `sql` config field, which today only has one legal value (SQLite). `apps/http-server` and `apps/cli` both pick it up automatically once it lands.
