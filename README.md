# lowercase

### ❗ Alpha Software (v0.1.0-alpha.10)

**lowercase** is in an early alpha stage and still taking shape. Some things work but APIs and behaviors will change as development evolves. Expect rough edges and breaking changes for now.

## Overview

**lowercase** is an event driven workflow engine built for testing AI pipelines. It's designed to run locally first, as a single process, but is built in a modular design.

Every component communicates through events. Infra should be swappable through interfaces. The architecture is modular and extensible, with the goal of supporting everything from lightweight in-memory execution to distributed setups. This repo exists for me to orchestrate AI pipelines, while keeping them observable and measurable.

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

### 3. Run with http server and vite react

I think you can go to `./apps/http-server` and type `pnpm dev` and `./apps/web-app` and type `pnpm dev` and get a user interface experience.

Does not support authoring flows in a visual editor yet, but can view, run, create forked sims, etc.

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
| **@lcase/services**        | Implements grouped application logic exposed to apps.        |
| **@lcase/use-cases**       | Small business logic reusable pieces.                        |
| **@lcase/cli**             | CLI for running and validating flows.                        |
| **@lcase/desktop**         | Electron desktop application. (deprecated)                   |
| **@lcase/http-server**     | Fastify http REST api and WebSocket server.                  |
| **@lcase/web-app**         | Vite / React web application.                                |
| **@lcase/observe-web**     | Vite web observability event viewer.                         |
| **@lcase/examples**        | Example / demo flows and servers.                            |

## Alpha 10 Highlights

React Web App + Http Server

## Next

Testing simple use case, and adjusting until viable.

MIT Open Source License: [LICENSE](LICENSE)
