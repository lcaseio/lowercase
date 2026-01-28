# lowercase

### ❗ Alpha Software (v0.1.0-alpha.9)

**lowercase** is in an early alpha stage and still taking shape. Some things work - mostly - but APIs and behaviors will change as development evolves. Expect rough edges and breaking changes for now.

## Overview

**lowercase** is an event driven workflow engine built for flexibility and composability. It's designed to run locally first, as a single process, and aims to make orchestrating complex systems, especially AI driven ones, feel simple, transparent, and powerful.

Every component, from queues to workers, communicates through events, allowing for generic components with swappable infrastructure. The architecture is modular and extensible, with the goal of supporting everything from lightweight in-memory execution to distributed setups. Observability is built into each component, with plans for an integrated dashboard and support for external monitoring tools. The goal is to create a laboratory for simulated run execution for AI pipelines.

## Current State

In brief, currently the system has several in process components: engine, event bus, router, queues, worker, tools, limiter, and observability sinks + tap. An electron desktop app wires up the runtime to run flows from disk. A cli also runs flows, validates them, and optionally plugs into a web socket observability frontend, currently un-wired.

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

### 2. run demo

#### Desktop Demo

```bash
pnpm -F @lcase/desktop dev
```

Basic desktop usage:

- Select a folder that contains flow definitions with the "folder button
- Start the runtime with the "start" button
- Run a flow with the "run" button
- Click on events to see their details, and click "clear" to clear the event list

#### CLI Parallel and Join Demo

See [examples/parallel.flow.json](examples/parallel.flow.json) for the JSON flow definition.

```bash
pnpm -F @lcase/cli start run examples/parallel.flow.json
```

### Examples

#### Demo flow executed in desktop application

![Electron Desktop](desktop.png)

#### Basic Observability WebSocket Event Viewer

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
| **@lcase/controller**      | Defines an api interface for backend apps.                   |
| **@lcase/services**        | Implements grouped application logic.                        |
| **@lcase/cli**             | CLI for running and validating flows.                        |
| **@lcase/desktop**         | Electron desktop application.                                |
| **@lcase/observe-web**     | Vite web observability event viewer.                         |
| **@lcase/examples**        | Example / demo flows and servers.                            |

## Alpha 8 Highlights: `v0.1.0-alpha.9`

### Simulation Foundations

Prepares for run simulation by adding a few pieces:

- `packages/flow-analysis` for validation and template string binding.
- `packages/json-ref-bind` for reading a template reference binding it to a value.
- `packages/artifacts` + `packages/adapters/artifact-store` for JSON CAS used in storing artifacts related to runs.
- Limiter component for event based tool concurrency limits (rate limit added later)
- Remove scheduler from concurrency or tool resolution.
- Small replay observability sink and jsonl store for storing all run events.

## Next for Alpha 9

### Milestone: Simulation

Something like this or smaller:

- Broader CAS for reusing run artifacts
- Fork runs
- Override inputs/steps
- Reuse outputs from parent runs
- Force rerun + cascade

## License

License may change to MIT later but currently:

This project is licensed under [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)

You are free to use, modify, and share the source code for noncommercial purposes, including personal, educational, and research use.

Commercial use is not permitted without permission from the author.
If you're interested in commercial use or have questions, feel free to reach out.
