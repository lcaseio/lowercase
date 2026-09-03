# Architecture

A map of what's here and where things go — not the reasoning behind it. For why things are shaped this way, see the ADRs ([`docs/adr/`](./adr/)) and, for the full evidence trail, the `architecture-boundaries` initiative's research docs ([`docs/initiatives/architecture-boundaries/research/`](./initiatives/architecture-boundaries/research/)).

**lowercase** is an event-driven workflow engine, built hexagonally (ports/adapters), with a reducer → planner → effect core (`packages/components/engine`) driving each run.

## Package layout

`apps/` is what you actually run. Everything else lives in `packages/`, organized into tiers — each one depends only on the tiers above it in this list.

### `apps/`

| App               | Purpose                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **`http-server`** | Fastify HTTP REST API, with Server-Sent Events for live run updates.                                                                          |
| **`workbench`**   | The dockview-based React frontend — flow graph, run replay, artifacts, and more.                                                              |
| **`cli`**         | Validates and runs flows from the command line. Currently paused/out of sync with the relational identity model; planned for a future rework. |
| **`desktop`**     | Electron shell reusing `workbench`'s UI. Mostly dormant today.                                                                                |

### `packages/` — foundation tiers

Depended on by everything else; nothing here depends back up.

| Tier                  | Where                        | What it is                                                                                                                                     |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **`types`**           | `packages/types`             | Pure vocabulary — a shape you can import without pulling in the library that produces it. Deliberately Prisma-free.                            |
| **`ports`**           | `packages/ports`             | Interfaces only — `WorkerPort`, `EventBusPort`, `ArtifactsPort`, etc. Nothing here does real work.                                             |
| **`specs`**           | `packages/specs`             | The flow-definition schema and parser (Zod).                                                                                                   |
| **`functional core`** | `packages/functional-core/*` | Zero ports, zero I/O — safe for anything to import directly. `flow-analysis` (dependency graph, toposort), `json-ref-binder` (ref resolution). |

### `packages/` — orchestration tiers

Each depends on the foundation above, but not on each other (except where noted).

| Tier                       | Where                               | What it is                                                                                                                                                                                                                                                   |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`application services`** | `packages/app-services`             | Application-facing business logic, called directly by an app or `runtime` (`RunService`, `FlowService`, ...).                                                                                                                                                |
| **Operations**             | _(convention, no dedicated folder)_ | Small, portable, single-port building blocks — called by whichever of the tiers here already holds the port they need. `runFlow()` (`packages/use-cases/run-flow`) is the one clean example today. Speculative tier, not yet proven at scale — see ADR-0005. |
| **`components`**           | `packages/components/*`             | Long-lived, self-driven by subscribing to the event bus rather than being called. `engine`, `worker`, `limiter`, `router`, `observability`.                                                                                                                  |
| **`adapters`**             | `packages/adapters`                 | Concrete implementations of ports — SQL repositories, filesystem artifact store, in-memory queue. Infrastructure mechanics only, never business decisions.                                                                                                   |

### `packages/` — composition and other packages

| Package                       | Purpose                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`runtime`**                 | The composition root — wires every port to its concrete adapter. The only place that imports both sides of a port at once.                                                                                                                                                                                     |
| **`events`**                  | Per-domain Zod schemas plus `EmitterFactory` (the concrete class behind `EmitterFactoryPort`). Straddles `functional core`/`adapter`, stays one package for cohesion.                                                                                                                                          |
| **`tools`**                   | The worker's built-in protocol bindings (`httpjson`, `mcp`) — not a plugin system or registry. See ADR-0006 for why there's no third-party tool registration.                                                                                                                                                  |
| **`db-prisma`**               | Prisma schema, migrations, and generated client. Doesn't fit any tier above — a project-owned, codegen-based dependency real adapters build on.                                                                                                                                                                |
| **`replay`**                  | Raw event history (JSONL log), separate from the SQL metadata store. Its exact tier is still an open question (adapter vs. something closer to Operations/application services) — see the [`architecture-boundaries` initiative](./initiatives/architecture-boundaries/INITIATIVE.md)'s "Not yet scoped" section. |
| **`use-cases/*`**             | Small, focused pieces (`run-flow`, `run-history`) whose internal shape predates the current taxonomy and needs further decomposition — don't treat today's layout as settled.                                                                                                                                  |
| **`archive/{controller,ui}`** | Real, unmaintained dependencies of `apps/desktop`'s older Electron bootstrap — kept as reference, not deleted, not actively developed.                                                                                                                                                                         |

`examples/` holds demo/example flows and servers — its own top-level workspace entry, not part of `packages/`.

## Storage: two tiers, don't conflate

- **SQL** (Prisma/SQLite) holds metadata only: `Flow`, `FlowVersion`, `Sim`, `Run`, `RunStepProjection`, and `Artifact` metadata (hash, contentType, size — no blob bytes).
- **CAS** (content-addressed, sha256-hashed, sharded on disk) holds the actual content — step outputs, exported values. Only hashes land in SQL.
- Replay history (the JSONL event log) is a third, separate concern — not folded into either.

## Where to look for more

- **Why things are shaped this way**: [`docs/adr/`](./adr/) — the decision records.
- **The evidence and discussion behind a decision**: `docs/initiatives/architecture-boundaries/research/` and its `arcs/` — working notes, not meant to be tidy.
- **Deeper technical/AI-oriented conventions** (run-execution flow, event categories, what's dead, what not to reintroduce): [`CLAUDE.md`](../CLAUDE.md).
