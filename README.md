# lowercase

### ❗ Alpha Software (v0.1.0-alpha.7)

**lowercase** is in an early alpha stage and still taking shape. Some things work - mostly - but APIs and behaviors will change as development evolves. Expect rough edges and breaking changes for now.

## Overview

**lowercase** is an event driven workflow engine built for flexibility and composability. It's designed to run locally first, as a single process, and aims to make orchestrating complex systems, especially AI driven ones, feel simple, transparent, and powerful. Instead of enforcing rigid rules, **lowercase**'s goal is to make things possible: to connect tools, services, and data streams in whatever way fits your use case.

Every component, from queues to workers, communicates through events, allowing for generic components with swappable infrastructure. The architecture is modular and extensible, with the goal of supporting everything from lightweight in-memory execution to distributed setups. Observability is built into each component, with plans for an integrated dashboard and support for external monitoring tools. The goal is to create fully replyable flows by snapshotting internal component state and persisting events.

## Current State

In brief, currently the system has several in process components: engine, event bus, router, queues, worker, tools, stream, resource manager, and observability sinks + tap. An electron desktop app wires up the runtime to run flows from disk. A cli also runs flows, validates them, and optionally plugs into a web socket observability frontend, currently un-wired.

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

| Package                     | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| **@lcase/types**            | Shared types across packages.                    |
| **@lcase/ports**            | Ports (Interfaces) and some supporting types.    |
| **@lcase/specs**            | Flow definition zod schemas.                     |
| **@lcase/events**           | Event schemas and helper functions.              |
| **@lcase/adapters**         | Implementations of ports.                        |
| **@lcase/engine**           | Event driven workflow engine.                    |
| **@lcase/worker**           | Orchestrates jobs and tool invocations.          |
| **@lcase/tools**            | Implements internal tools and some tool configs. |
| **@lcase/resource-manager** | Handles concurrency and resolving caps to tools. |
| **@lcase/observability**    | Observability tap and sinks for events.          |
| **@lcase/runtime**          | Wires up a configurable runtime.                 |
| **@lcase/controller**       | Defines an api interface for backend apps.       |
| **@lcase/services**         | Implements grouped application logic.            |
| **@lcase/cli**              | CLI for running and validating flows.            |
| **@lcase/desktop**          | Electron desktop application.                    |
| **@lcase/observe-web**      | Vite web observability event viewer.             |
| **@lcase/examples**         | Example / demo flows and servers.                |

## Alpha 7 Highlights: `v0.1.0-alpha.7`

### Resource Manager

- New `@lcase/resource-manager` component resolves tools and handles concurrency.
- Grouped tools or "capabilities" were removed from workers, now resolved by the RM.

### Engine

- Engine has been refactored into a simpler orchestration class.
- Engine logic has been moved to a reducer + effect planner + effect executor system, running off of an internal message queue.
- New `parallel` step type allows steps to be started simultaneously but concurrently.
- New `join` step type fires when all steps listed have been completed, invoking the next step.

### Tools and Events

- New `httpjson` tool and step type allows custom calls to http endpoints.
- Type system around internal tools has been reworked around "bindings".
- Tools receive a capability event, and return a common event type.
- In-Memory Event bus supports simple pattern matching when emitting events.

## Next for Alpha 8

### Replay

- Persist events through an event sink.
- Capture state snapshots that correlate to specific events.
- Rehydrate state by replaying events from zero.
- Load state snapshots and continue a run from a specific point.
- Refactor components as needed for deterministic state recreation.

## One day...

- Persistence Layer / Swappable Infra implemented
- UI Overhaul / Actual Implementation.
- Web server application + docker.
- LLM + Eval Tooling
- External Tool SDK

## License

This project is licensed under [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)

You are free to use, modify, and share the source code for noncommercial purposes, including personal, educational, and research use.

Commercial use is not permitted without permission from the author.
If you're interested in commercial use or have questions, feel free to reach out.
