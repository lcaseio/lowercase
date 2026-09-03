# lowercase

[![CI](https://github.com/lcaseio/lowercase/actions/workflows/ci.yaml/badge.svg)](https://github.com/lcaseio/lowercase/actions/workflows/ci.yaml)
[![License](https://img.shields.io/github/license/lcaseio/lowercase)](LICENSE)
[![Last commit (main)](https://img.shields.io/github/last-commit/lcaseio/lowercase/main?label=last%20commit%20%28main%29)](https://github.com/lcaseio/lowercase/commits/main)
[![Last commit (dev)](https://img.shields.io/github/last-commit/lcaseio/lowercase/dev?label=last%20commit%20%28dev%29)](https://github.com/lcaseio/lowercase/commits/dev)

## Alpha Software (v0.1.0-alpha.13)

**lowercase** is in an early alpha stage and still taking shape. Some things work but APIs and behaviors will change as development evolves. Expect rough edges and breaking changes for now.

`main` reflects the latest tagged alpha release (this README). Active development happens on `dev`, which is ahead of `main` and may be unstable.

## Overview

**lowercase** is an event-driven workflow engine for building and testing AI/LLM-driven pipelines: flows defined as JSON, executed step by step, with structured validation of model output and branching based on it.

It runs locally today, as a single process: SQL (SQLite) holds metadata (flows, artifacts, sims, runs, evals), a content-addressed filesystem store holds immutable content (LLM outputs, API responses, exported values), and the event bus and job queue are both in-memory. Business logic is written against interfaces rather than these specific implementations, so other backends could get swapped in later — Redis Streams for the queue and MinIO for blob storage are the leading candidates — but that's a design intent, not a present capability.

## The Workbench (`apps/workbench`)

![The Workbench: FlowExplorer tree, an open Flow Graph panel with custom branch/parallel/join nodes, the Step Details right-rail, and a synced JSON Definition panel](workbench-01.png)

`apps/workbench` is a dockview-based **Workbench**: a persistent shell with a left-side FlowExplorer tree (Flows → Versions, with Runs/Sims/Artifacts nested under each version) and a Dock of open/closeable/draggable panels — Flow Graph, Event Graph, artifacts, flow authoring, step results, and more — plus a Postman-style right-rail (Parameters, Run Input, Simulate, Problems, Step Details, Step Results, Settings) that follows whichever panel is focused.

- **Flow Graph**: dagre-based auto-layout, custom node types per step kind, branch/parallel handling, and replay — play back a run's event history (play/pause, speed selection, cancel) and watch step status update live, in sync with a companion Event Graph panel.
- **Flow authoring**, from the tree: create a flow by uploading a JSON file or typing one in, with live schema validation and a synced graph preview. Full drag-and-drop visual editing isn't built yet.
- **Sims and Artifacts** are first-class tree branches and panels, not separate top-level pages.
- **Panel state** (params, run selection, layout, replay position, and more) persists across tab switches, in-app navigation, and a real reload.

Full design history: [`docs/initiatives/ui-workspace/INITIATIVE.md`](docs/initiatives/ui-workspace/INITIATIVE.md).

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

### 3. run with http server and vite react

The current primary way to work with flows — see [The Workbench](#the-workbench-appsworkbench) above for everything it covers. Runs as two separate long-lived processes, each in its own terminal:

```bash
cd apps/http-server && pnpm dev
```

```bash
cd apps/workbench && pnpm dev
```

![A run replaying in the Flow Graph panel (branch path highlighted, playback controls visible) with the Event Graph docked below, in sync](workbench-02.png)

### 4. CLI

`@lcase/cli` can still validate a flow definition against the schema without running it:

```bash
pnpm -F @lcase/cli start validate ./examples/parallel.flow.json
```

The rest of the CLI (`add`/`run`/`sim`) is currently out of sync with the relational identity model introduced during the SQL migration — `run` now expects `<flowId> <flowVersionId> <flowDefHash>`, which `add` doesn't yet produce, and `sim` still uses an older fork path with no params support. It's paused pending a rework, not a supported walkthrough right now — use the HTTP server + web app above instead.

## Weather Example (Local LLM)

Steps reference each other's data through normalized, path-addressable values (`{{params.x}}`, `{{steps.x.exports.y}}`) across `application/json`, `text/plain`, and `text/markdown`; a step's export can declare a JSON Schema, validated with `ajv`, before any downstream step trusts it — an LLM's structured output is checked, not assumed.

[`examples/llm-weather.flow.json`](examples/llm-weather.flow.json) is a real worked example of this: a local LLM parses a free-text weather question into validated structured intent + location, and the flow branches to different external API endpoints (forecast vs. air quality) based on that intent, with a graceful fallback for off-topic questions.

Not a one-command demo, though — its `text/markdown` params (`systemParser`, `userParser`, `systemReport`) need real prompt content supplied as run params before it'll actually execute, and only a partial starting point ([`examples/weather.system.prompt.md`](examples/weather.system.prompt.md)) is checked in. Worth reading the flow definition to see what each param expects rather than assuming it runs out of the box. Also needs a local LLM reachable over HTTP — see the flow definition for the expected endpoint. Hosted LLM API providers aren't wired up yet.

## Other commands

```bash
pnpm build-packages   # build only packages/ (skips apps/)
pnpm typecheck        # typecheck every package (turbo fan-out)
pnpm lint             # real ESLint config only in apps/workbench today; most packages stub this as a no-op
pnpm -r test          # run every package's unit test suite
```

Further test coverage will grow as the architecture is cemented. Large breaking changes are still in progress.

## Code Layout

`apps/` is what you actually run; almost everything else lives in `packages/`, organized into dependency-ordered tiers. Full package-by-package map, including the settled tier taxonomy: [`docs/architecture.md`](docs/architecture.md).

## Next

No committed next milestone yet — real candidates on the table: an evals rework (today's eval is a flow-embedded v1 slice; the goal is standalone, reusable eval entities — see [`docs/initiatives/evals/INITIATIVE.md`](docs/initiatives/evals/INITIATIVE.md)), a `packages/components/worker`/tool-interaction refactor (already flagged as unsettled), real binary artifact support, and general architecture-hardening work (the `packages/events` schema boilerplate + EmitterFactory rework, `packages/runtime`'s two incomplete wiring paths, a few engine bugs/enhancements). See [`docs/todo.md`](docs/todo.md) for the fuller backlog.

## License

MIT — see [LICENSE](LICENSE).
