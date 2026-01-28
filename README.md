# lowercase

### ❗ Alpha Software (v0.1.0-alpha.9)

**lowercase** is in an early alpha stage and still taking shape. Some things work - mostly - but APIs and behaviors will change as development evolves. Expect rough edges and breaking changes for now.

## Overview

**lowercase** is an event driven workflow engine built for flexibility and composability. It's designed to run locally first, as a single process, and aims to make orchestrating complex systems, especially AI driven ones, feel simple, transparent, and powerful.

Every component, from queues to workers, communicates through events, allowing for generic components with swappable infrastructure. The architecture is modular and extensible, with the goal of supporting everything from lightweight in-memory execution to distributed setups. Observability is built into each component, with plans for an integrated dashboard and support for external monitoring tools. The goal is to create a laboratory for simulated run execution for AI pipelines.

## Current State

In brief, currently the system has several in process components: engine, event bus, router, queues, worker, tools, limiter, and observability sinks + tap. An electron desktop app used to run flows, but the architecture is shifting and it is deprecated. A cli runs flows, validates them, runs forked sims, and optionally plugs into a web socket observability frontend, currently un-wired.

## Quickstart

### package managers

This monorepo uses [pnpm](https://pnpm.io/) via [Corepack](https://github.com/nodejs/corepack), and can be built with [turborepo](https://turborepo.com/). If you don't have pnpm installed globally, enable corepack (bundled with Node 16.10+):

```bash
corepack enable
```

Post alpha versions of this repo will support other package managers.

### 1. install + build

```bash
pnpm install
pnpm build
```

### 2. Run With CLI

#### CLI Parallel and Join Demo

See [examples/parallel.flow.json](examples/parallel.flow.json) for the JSON flow definition.

#### Add flow definition to CAS:

```bash
pnpm -F @lcase/cli start add ./examples/parallel.flow.json
```

#### Run flow with CAS hash:

```bash
pnpm -F @lcase/cli start run c6118f8f8c1a4545fba2249fb88f23e452605b0bd26f4620e9d1664b73ecd3db
```

#### Fork and Simulate the run from the resulting run id, reusing step `two`

```bash
pnpm -F @lcase/cli start sim run-e26b174c-ee72-4302-87bd-6d1b1f0c042c -r two
```

## Electron App (deprecated)

#### Example of a demo flow being executed using the desktop app.

Currently the desktop app is being rewritten to eventually be ported to Tauri via an http server + frontend.

![Electron Desktop](desktop.png)

### Basic Observability WebSocket Event Viewer (un-wired)

This event viewer `@lcase/observe-web` is currently un-wired from the cli by default but can be wired in.

![Art Streaming Demo Terminal Example](observe-web.png)

## unit tests

You can run unit tests for various components across the repo.

```
pnpm -r test

```

Further test coverage will grow as the architecture is cemented. Large breaking changes are still in progress.

## Monorepo Packages

| Package                    | Purpose                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **@lcase/types**           | Shared types across packages.                                |
| **@lcase/ports**           | Ports (Interfaces) and some supporting types.                |
| **@lcase/specs**           | Flow definition zod schemas.                                 |
| **@lcase/events**          | Event schemas and helper functions.                          |
| **@lcase/adapters**        | Implementations of ports.                                    |
| **@lcase/engine**          | Event driven workflow engine.                                |
| **@lcase/worker**          | Orchestrates jobs and tool invocations.                      |
| **@lcase/tools**           | Implements internal tools and some tool configs.             |
| **@lcase/scheduler**       | No longer used for concurrency or tool resolution.           |
| **@lcase/limiter**         | Global rate and concurrency limiter per tool.                |
| **@lcase/observability**   | Observability tap and sinks for events.                      |
| **@lcase/flow-analysis**   | Builds a flow graph and analyzes template references.        |
| **@lcase/json-ref-binder** | Binds output from JSON path reference to template reference. |
| **@lcase/artifacts**       | JSON CAS file system store.                                  |
| **@lcase/runtime**         | Wires up a configurable runtime.                             |
| **@lcase/services**        | Implements grouped application logic.                        |
| **@lcase/cli**             | CLI for running and validating flows.                        |
| **@lcase/desktop**         | Electron desktop application.                                |
| **@lcase/observe-web**     | Vite web observability event viewer.                         |
| **@lcase/examples**        | Example / demo flows and servers.                            |

## Alpha 9 Highlights

### Simulation Basics

- Add a simple `RunIndex` format to quickly read step outputs from a previous run.
- Reference flow definitions and `ForkSpec` by hashes in CAS.
- Engine uses `ForkSpec` + `RunIndex` to create a `RunPlan`.
- Add a CLI command to run a forked simulation and store flows in CAS.

## Next for Alpha 10

### Milestone: HTTP Server + React UI

Something like this or smaller:

- Wrap existing services in an HTTP Rest API server.
- Implement an browser web front end that communicates with the HTTP server.
- Scaffold the outline of sections for a reusable UI across deployments.
- Add basic UI functions for listing flows, viewing flows trees, running flows.

## License

MIT Open Source License: [LICENSE](LICENSE)
