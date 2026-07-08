# lowercase

### ❗ Alpha Software (v0.1.0-alpha.11)

**lowercase** is in an early alpha stage and still taking shape. Some things work but APIs and behaviors will change as development evolves. Expect rough edges and breaking changes for now.

## Overview

**lowercase** is an event driven workflow engine built for testing AI pipelines. It's designed to run locally first, as a single process, but is built in a modular design.

Every component communicates through events. Infra is swappable, but not yet implemented in various forms, through ports/adapters — SQL owns metadata (flows, artifacts, sims, runs) and a separate content-addressed store owns immutable content (LLM outputs, API responses, exported values). The architecture is modular and extensible, with the goal of supporting everything from lightweight in-memory execution to distributed setups.

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

## Alpha 11 Highlights

- SQL owns metadata (flows, artifacts, sims, runs) with relational identity throughout; CAS remains separate for immutable content.
- Run params and step exports are normalized, referenceable values (`{{params.x}}`, `{{steps.x.exports.y}}`) across `application/json`, `text/plain`, and `text/markdown`.
- Step exports can declare a JSON Schema, validated with `ajv` before downstream steps trust the value — an LLM's structured output is checked, not assumed.
- A new `branch` step type routes to different next-steps based on a resolved referenced values, with a mandatory default case — a pure control-flow node (same category as `join`/`parallel`), resolved via an engine effect reading CAS directly rather than a worker job.
- A working end-to-end example ([examples/llm-weather.flow.json](examples/llm-weather.flow.json)): a local LLM parses a free-text weather question into validated structured intent + location, and the flow branches to different external API endpoints (forecast vs. air quality) based on that intent, with a graceful fallback for off-topic questions. The flow assumes connection to a local llm at a specific local IP address. Popular LLM tools accessable through api authentication is deferred for future update.

## Next

The next planned milestone is a minimal eval/measurement vertical slice — evals modeled as normal flows, scoring a stable exported output from a subject run, with a minimal comparison UI.

MIT Open Source License: [LICENSE](LICENSE)
