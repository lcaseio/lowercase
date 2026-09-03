# Prove Swappable Infrastructure

## Summary

The actual reason this milestone exists: build a real remote worker and deploy it. Everything else here is in service of that — a worker running out-of-process needs infrastructure it can actually reach from another process/machine, which today's defaults (`InMemoryQueue`, local `FsArtifactStore`, SQLite) don't provide. Whether the remote worker itself gets built and deployed as part of this milestone or as a follow-on right after is still open — but it's the goal driving the scope below, not a hypothetical this milestone is merely preparing for.

The ports/adapters boundary is meant to let other infrastructure backends get swapped in later (candidates already named in the root `README.md`: Redis Streams for the job queue, MinIO for CAS/blob storage) — but that's only a structural claim until real alternate implementations actually exist behind those ports. This milestone is where that gets tested for real, via the Worker V2 plan's [Phase 6](../../component-architecture/worker-v2/README.md#phase-6-exercise-a-remote-boundary) (deliberately left optional there until deployment independence is actually being tested — this milestone is that trigger).

Adapter surface, now scoped into individual PRs (see PR index below):

- **Queue + messaging** — Redis Streams, replacing `InMemoryQueue`. There is no separate event bus: Streams is the sole carrier for everything bus-shaped too (commands, lifecycle events, telemetry, metrics), split across separate streams per message category — matching the category split `docs/component-architecture/model.md` already draws — with independent consumer groups per concern (e.g. the engine and observability each get their own group on the same stream, seeing every entry, acking on their own schedule) rather than a dedicated pub/sub technology.
- **CAS/blob storage** — MinIO, replacing `FsArtifactStore`.
- **SQL** — Postgres via Prisma, replacing SQLite (schema's already Prisma-based, so this is a backend swap, not a schema rewrite; the existing SQLite migration history collapses/resets rather than carrying forward).

New adapters alone aren't the whole goal — `packages/runtime` itself needs to actually pick between them by config, not just gain a second hardcoded option. `CLAUDE.md` already names this as unfinished: `createServices()`/`createRuntime()` are "two separate/incomplete wiring paths," with a single, unified config-driven creation system as the stated (not yet built) direction. This milestone is likely where that consolidation actually has to happen, since it's the first time more than one real backend per port exists to choose between.

Reordered ahead of `json-schema-migration`/`rate-limiting`/`engine-hardening`/`runtime-storage-consolidation` (see `docs/milestones/README.md`) — originally scaffolded to run last, once other boundaries had stabilized, but now the intended next milestone after `worker-tools-artifacts`.

## Evolution

Originally scaffolded as one of seven architecture milestones, sequenced last — a validation exercise to run once every other boundary had stabilized, not a build target in its own right. Reordered to slot 5, right after `worker-tools-artifacts`, once the real motivation became explicit: this milestone exists to build and deploy a real remote worker, not to prove swappability in the abstract (see Summary).

No natural single starting point among the three candidate adapters (queue/messaging, CAS, SQL) — none blocks the others, and picking a "correct" first one didn't seem worth over-planning. Landed on CAS first anyway, once discussed: `ArtifactStorePort`'s surface is the narrowest of the three and already hardened by the `worker-tools-artifacts` refactor, making it the lowest-risk way to prove the adapter pattern before tackling the queue or SQL (see [`arcs/cas-adapter.md`](./arcs/cas-adapter.md)) — not a signal that CAS is more important, just the easiest place to start.

**Whether an out-of-process worker needed a separate event bus, resolved rather than left open.** The worry: worker lifecycle needs to reach both the engine (to advance the run plan) and observability (durable event history for debug/replay) — genuinely different consumers, for different reasons, both needing every event, not a subset. Resolved without adding a second messaging technology: Redis Streams' consumer-group model already gives multiple independent durable readers of the same stream — exclusivity (an entry going to only one consumer) is scoped to consumers _within_ one group, not across groups, so the engine and observability can each run their own consumer group on the same stream and both see everything, acknowledging independently. So there's no EventBus adapter in this milestone at all — Redis Streams (split into separate streams per message category: commands, lifecycle events, telemetry, metrics) is the sole carrier.

## PR index

Reordered from the original scaffold after runtime-composition research (see `arcs/cas-adapter.md`'s PR 2 discussion) replaced the original single "wire CAS into runtime" step with a bigger, more honest sequence. This is expected — the original list was a best-effort scaffold, not a commitment; incrementing as real scope becomes clear is the normal process, not a sign of drift.

| PR  | Description                                                                    | Status        | Where | See also |
| --- | ------------------------------------------------------------------------------ | ------------- | ----- | -------- |
| 1   | S3 CAS adapter (MinIO-backed) + tests                                          | merged (#360) | [1]   |          |
| 2   | Shared assembly layer + leaf config types in `packages/runtime`                | merged (#361) | [1]   |          |
| 3   | Shared `local-system` profile (real CAS choice) + retrofit `http-server`/`cli` | merged (#362) | [1]   |          |
| 4   | `MessageLogPort` + Redis-backed adapter (retitled from "queue" -- see [2])     | merged (#363) | [2]   |          |
| 5   | Package hygiene: delete `NodeRouter`/`QueuePort`, real ESLint for `adapters`   | in progress   | [2]   |          |
| 6   | `JobExecutorPort` envelope-fidelity fix (local only, prerequisite for 7)       | not started   | [2]   |          |
| 7   | Redis-backed `JobExecutorPort` adapter (engine <-> worker dispatch)            | not started   | [2]   |          |
| 8   | Worker lifecycle sink (Redis-backed) + temporary lifecycle bridge to bus       | not started   | [2]   |          |
| 9   | Extend `local-system`'s `jobExecution` binding with a `redis-streams` branch   | not started   | [2]   |          |
| 10  | Postgres adapter (Prisma)                                                      | not started   | [3]   |          |
| 11  | Extend `local-system` profile with `postgres` SQL branch                       | not started   | [3]   |          |

## Not yet scoped

- **Migrating the worker to run genuinely out-of-process (a separate deployment, not just a separate Redis-backed binding while still embedded)** — the point of this whole milestone, but deliberately not numbered as a PR yet. PR 9 keeps the worker in-process even once it's Redis-backed; actually moving it to a separate deployment is real, separate design work (per Worker V2 plan's Phase 6) that should get its own discussion once the infrastructure underneath it is real, not planned speculatively now.
- **The engine's own step/run self-loop (subscribing to events it publishes itself, purely to advance its own internal state)** — a real, precedented, low-risk fix (mirroring how `ExecuteHttpJsonJobFx` already avoids this), but decoupled from every PR in this milestone: nothing here depends on it, and it doesn't ease anything here either, since the self-loop never touches `MessageLogPort`/Redis at all. Deferred to whenever the engine gets its real core/inbound-outbound refactor. See `arcs/queue-adapter.md`'s PR 5-9 discussion for the full reasoning.
- **`LifecycleEventIngress`** — no longer unscoped: PR 8 is exactly this (a Redis-backed worker lifecycle sink + a temporary bridge republishing onto the existing bus). See `arcs/queue-adapter.md`.

Scaffolded now, work not yet started.

[1]: ./arcs/cas-adapter.md
[2]: ./arcs/queue-adapter.md
[3]: ./arcs/sql-adapter.md
