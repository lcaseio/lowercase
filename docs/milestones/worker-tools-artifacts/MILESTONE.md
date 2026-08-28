# Worker, Tools, and Artifacts

## Summary

Rework the worker/tools boundary and settle where `packages/artifacts` actually belongs (infrastructure vs. an application-level component) — both already flagged as open questions in `CLAUDE.md`. Depends on [`architecture-boundaries`](../architecture-boundaries/MILESTONE.md)'s decisions.

Real binary artifact support (deferred per `docs/todo.md` and `CLAUDE.md`) is a possible byproduct once this boundary is settled, not the primary goal.

## Evolution

Picked up 2026-08-26, right after `events-refactor` closed, over `json-schema-migration` (set aside deliberately, not now) and `rate-limiting` (a lighter lift, but lower-priority than `packages/components/worker`, a longer-standing refactor target). Worker before artifacts: the two are genuinely tangled (worker writes job output/exports into CAS, and today's capture path limits what can be saved), but `ADR-0006` already settled worker's extension-model design, while artifacts' own infra-vs-application-component boundary is still fully open — artifacts will likely get touched once worker reaches its CAS-writing edges, not deferred out of this milestone.

Started with an investigation pass (PR 1), mirroring `events-refactor`'s discussion-first research and `architecture-boundaries` PR 4's own worker-tool-extensibility research — see [`worker-investigation.md`](./arcs/worker-investigation.md) for the concrete symptoms it found in `worker.ts` itself.

That investigation surfaced findings bigger than worker alone — a candidate port-driven component-interaction model, synthesized (with outside model assistance) into the durable, top-level [`docs/component-architecture/`](../../component-architecture/README.md) reference rather than designed in place here. PR 1 closed as investigation-only; PRs 2–6 now follow that plan's phases (see PR index), each still discussed individually before being planned. The standalone-limiter/remote-worker pieces that plan also raised are explicitly not part of this milestone's committed PRs (see Not yet scoped).

## Design principles

This project treats event-driven design, deterministic replay, and swappable infrastructure as goals worth pursuing in their own right, not as solutions derived from a proven necessity — they're genuinely interesting to build and learn, independent of whether this system ever needs to scale. Component boundaries (ports, real event emission, the option to run pieces in-process today or split them out later) are kept honest even where a simpler direct-call implementation would suffice right now.

This doesn't excuse accidental complexity — duplicate mechanisms, dead code, accreted special-casing are still real problems to fix regardless of which philosophy the system is built toward. The bar for a design decision in this milestone is "is this a deliberate, well-executed version of the pattern," not "is this the minimum necessary."

PRs 2 and onward are additionally governed by [`docs/component-architecture/`](../../component-architecture/README.md)'s pattern (inbound/outbound ports, commands vs. lifecycle events vs. telemetry as distinct categories) rather than restated here. One heuristic from that work worth keeping close at hand regardless of implementation details: **adapter/mechanism choice must never change observability semantics** — swapping how a component is reached (direct call vs. bus) must never silently change what gets recorded as having happened.

## PR index

| PR  | Description                                                                               | Status        | Where                                                            | See also                                                                                                          |
| --- | ----------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Worker/tools investigation — history, current shape, refactor direction                   | merged (#350) | [`arcs/worker-investigation.md`](./arcs/worker-investigation.md) |                                                                                                                   |
| 2   | Worker V2 core contract + fake collaborators, no runtime wiring                           | merged (#351) | [`arcs/worker-v2-build.md`](./arcs/worker-v2-build.md)           | [Worker V2 plan — Phase 1](../../component-architecture/worker-v2/README.md#phase-1-core-contract-and-tests)      |
| 3   | HTTP JSON vertical slice — first real protocol path through Worker V2                     | merged (#352) | [`arcs/worker-v2-build.md`](./arcs/worker-v2-build.md)           | [Worker V2 plan — Phase 2](../../component-architecture/worker-v2/README.md#phase-2-http-json-vertical-slice)     |
| 4   | Legacy compatibility adapter — connects Worker V2 to the current engine unchanged         | in progress   | [`arcs/worker-v2-build.md`](./arcs/worker-v2-build.md)           | [Worker V2 plan — Phase 3](../../component-architecture/worker-v2/README.md#phase-3-legacy-compatibility-adapter) |
| 5   | Engine migrates to `WorkerDispatch` — monolith bypasses router/queue for Worker V2        | not started   | [`arcs/worker-v2-build.md`](./arcs/worker-v2-build.md)           | [Worker V2 plan — Phase 4](../../component-architecture/worker-v2/README.md#phase-4-engine-workerdispatch)        |
| 6   | Complete the worker surface — MCP, binary capture, remove old worker/tool-registry/router | not started   | [`arcs/worker-v2-build.md`](./arcs/worker-v2-build.md)           | [Worker V2 plan — Phase 5](../../component-architecture/worker-v2/README.md#phase-5-complete-the-worker-surface)  |

## Next up

PR 5 — Engine migrates to `WorkerDispatch`: the monolith bypasses router/queue for Worker V2 in-process. Not yet discussed. Starting reference: [Worker V2 plan — Phase 4](../../component-architecture/worker-v2/README.md#phase-4-engine-workerdispatch).

PR 6 continues the same plan's phased sequence (completing the worker surface — MCP, binary capture, removing the old worker/tool-registry/router). Both seeded from [`docs/component-architecture/worker-v2/README.md`](../../component-architecture/worker-v2/README.md)'s phased plan, itself synthesized from PR 1's investigation plus a larger-model review (see that milestone's own arc file for how the plan was produced) — a starting reference, not a commitment. Each PR still gets discussed on its own terms before being planned, per the usual workflow, and may end up split further once that discussion happens.

## Not yet scoped

- **Remote worker boundary** (Worker V2 plan's Phase 6) — deliberately optional/deferred until deployment independence is actually being tested, not before.
- **Shared resource coordinator / limiter redesign** (Worker V2 plan's Phase 7, informed by [`limiter.next.temp.ts`](../../../packages/components/limiter/src/limiter.next.temp.ts)'s sketch and [`review-results.md`](../../component-architecture/review-results.md)'s recommended shape) — a separate piece of work, not part of PRs 2–6 above. Worker V2's phases 1–5 use a purely local `ResourceAdmission` adapter and don't require rebuilding or distributing the limiter at all; that only becomes necessary once multiple real workers need to coordinate access to the same constrained resource, which isn't true today.
- **A Proposed-status ADR for the port-driven component-interaction model** — deliberately held off per existing ADR practice (decide once proven, not before) and because there's no second reader for it yet (solo project, one milestone worked at a time). Write it the moment any other milestone starts touching a component boundary before this vertical slice finishes — that's the concrete trigger, not a fixed date.
- **`packages/artifacts`' infrastructure-vs-application-component boundary question**, and real binary artifact support as its likely byproduct — still open, genuinely depends on where the worker-side work lands.
- **Repo-hygiene pass on `packages/components/worker`**, same treatment `events-refactor` PR 3 gave `packages/events`: a `tsconfig.typecheck.json` so `tests/` actually gets type-checked, `clean-dist`/`clean-node-modules` scripts, a real ESLint config in place of the `echo lint` stub, then an actual clean/reinstall/rebuild/lint pass and fix whatever surfaces. Not yet ordered against PRs 2–6 — could land before Worker V2 work starts, after it, or get folded into whichever PR first touches the package for other reasons (the incremental-rollout policy `events-refactor` itself established).
