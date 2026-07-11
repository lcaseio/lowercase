# lowercase

### ❗ Alpha Software (v0.1.0-alpha.12)

**lowercase** is in an early alpha stage and still taking shape. Some things work but APIs and behaviors will change as development evolves. Expect rough edges and breaking changes for now.

`main` reflects the latest tagged alpha release (this README). Active development happens on `dev`, which is ahead of `main` and may be unstable.

## Overview

**lowercase** is an event-driven workflow engine for building and testing AI/LLM-driven pipelines: flows defined as JSON, executed step by step, with structured validation of model output and branching based on it. Today it runs locally, as a single process.

Every component communicates through events, and business logic depends only on interfaces (hexagonal ports/adapters), not on specific infrastructure. Right now, every implementation behind those interfaces is local: SQL (SQLite) owns metadata (flows, artifacts, sims, runs, evals), a content-addressed filesystem store owns immutable content (LLM outputs, API responses, exported values), and the event bus and job queue are both in-memory. The ports/adapters boundary exists so other backends could be swapped in later without touching business logic — candidates include Redis Streams for the job queue and MinIO for CAS/blob storage — but that's a structural property, not a current capability: none of those adapters exist yet.

## Quickstart

### package managers

This monorepo uses [pnpm](https://pnpm.io/) via [Corepack](https://github.com/nodejs/corepack), and can be built with [turborepo](https://turborepo.com/). If you don't have pnpm installed globally, enable corepack (bundled with Node 16.10+):

```bash
corepack enable
```

Post alpha versions of this repo should being to support other package managers.

### 1. install + build

```bash
pnpm install
pnpm build
```

### 2. set up the database

```bash
pnpm db:migrate
```

Applies Prisma migrations to a local SQLite file. Defaults to `lcase-db/sqlite/dev.db` at the repo root — no `.env` needed unless you want to point it somewhere else (see `.env.example` for the `DATABASE_URL` override).

### 3. Run with http server and vite react

Go to `./apps/http-server` and run `pnpm dev`, and `./apps/web-app` and run `pnpm dev`, for the current primary way to run and inspect flows.

Does not support authoring flows in a visual editor yet, but can view, run, create forked sims, etc.

### 4. CLI

`@lcase/cli` can still validate a flow definition against the schema without running it:

```bash
pnpm -F @lcase/cli start validate ./examples/parallel.flow.json
```

The rest of the CLI (`add`/`run`/`sim`) is currently out of sync with the relational identity model introduced during the SQL migration — `run` now expects `<flowId> <flowVersionId> <flowDefHash>`, which `add` doesn't yet produce, and `sim` still uses an older fork path with no params support. It's paused pending a rework, not a supported walkthrough right now — use the HTTP server + web app above instead.

## unit tests

You can run unit tests for various components across the repo.

```
pnpm -r test

```

Further test coverage will grow as the architecture is cemented. Large breaking changes are still in progress.

## Monorepo Packages

| Package                    | Purpose                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **@lcase/types**           | Shared types across packages.                                                                                                         |
| **@lcase/ports**           | Ports (Interfaces) and some supporting types.                                                                                         |
| **@lcase/specs**           | Flow definition zod schemas.                                                                                                          |
| **@lcase/events**          | Event schemas and helper functions.                                                                                                   |
| **@lcase/adapters**        | Implementations of ports.                                                                                                             |
| **@lcase/engine**          | Event driven workflow engine.                                                                                                         |
| **@lcase/worker**          | Orchestrates jobs and tool invocations.                                                                                               |
| **@lcase/tools**           | Implements internal tools and some tool configs.                                                                                      |
| **@lcase/scheduler**       | Deprecated — dead code pending removal. Superseded by `@lcase/limiter`.                                                               |
| **@lcase/limiter**         | Global rate and concurrency limiter per tool.                                                                                         |
| **@lcase/observability**   | Observability tap and sinks for events.                                                                                               |
| **@lcase/flow-analysis**   | Builds a flow graph and analyzes template references.                                                                                 |
| **@lcase/json-ref-binder** | Binds output from JSON path reference to template reference.                                                                          |
| **@lcase/artifacts**       | JSON / text/ markdown CAS file system store.                                                                                          |
| **@lcase/runtime**         | Wires up a configurable runtime.                                                                                                      |
| **@lcase/services**        | Implements grouped application logic exposed to apps.                                                                                 |
| **@lcase/use-cases**       | Small business logic reusable pieces.                                                                                                 |
| **@lcase/controller**      | Mostly dead — was an Electron IPC-vs-HTTP UI abstraction, no longer needed after backing out of Electron in favor of the HTTP server. |
| **@lcase/cli**             | CLI for running and validating flows. Currently paused/out of sync with the relational identity model; planned for a future rework.   |
| **@lcase/desktop**         | Electron desktop application. (deprecated)                                                                                            |
| **@lcase/http-server**     | Fastify http REST api and WebSocket server.                                                                                           |
| **@lcase/web-app**         | Vite / React web application.                                                                                                         |
| **@lcase/observe-web**     | Vite web observability event viewer. (obsolete)                                                                                       |
| **@lcase/examples**        | Example / demo flows and servers.                                                                                                     |

## Alpha 12 Highlights

- Eval/measurement vertical slice: proves the engine's experimentation loop end-to-end — run a flow, judge its output, store the score, compare results — as a first-class part of the system rather than something inferred from logs after the fact.
- Evals are modeled as ordinary flows, no new engine primitives: a rubric-based LLM-as-judge flow ([examples/eval-judge.flow.json](examples/eval-judge.flow.json)) takes a subject run's export as a normal param and produces a structured, multi-metric score (overall + named dimensions + rationale).
- A `kind` distinction on flows (`business` vs. `eval`) categorizes eval flows so they can be surfaced separately in the UI.
- `evalContext`: a flow can declare, per export, which other refs from the same run (a param, another step's export, or a step's raw output) are useful context for judging that export — resolved automatically when an eval is triggered, no caller involvement required.
- `EvalResult` storage: fixed columns for what every consumer needs (target run, evaluator identity, overall score, pass/fail) plus a flexible JSON payload for the per-dimension breakdown and rationale, validated at the application layer.
- A minimal comparison UI in the web app: trigger an eval directly from a run's export, then browse/compare results by target flow + step + export identity (spanning every version of a flow, so a score shift between versions is visible) with a table and bar chart.
- Verified live, end-to-end, against a real local LLM — including catching and fixing a real race condition between two observability sinks reacting to the same event (see `docs/todo.md`).

## Next

No scoped milestone yet — the current direction is a larger UI rework for `apps/web-app`, moving away from page navigation toward a desktop-style panel/toolbar model with real relational organization (grouping, comparison, drilling into one flow version's context). Still in the design/prototyping stage.

MIT Open Source License: [LICENSE](LICENSE)
