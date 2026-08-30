# Component Architecture

What's in this folder, not the reasoning behind it. For the current, plain package
map, see [`docs/architecture.md`](../architecture.md); for accepted decisions, see
[`docs/adr/`](../adr/). This folder is where a bigger architecture question gets
worked out _before_ it's settled enough to become either of those — a draft model,
ongoing scrutiny of it, and the concrete build plans that put it into practice.

## [`model.md`](./model.md)

The draft itself: a candidate port-driven component-interaction model (separating
commands, lifecycle facts, replies, and telemetry) for running components
in-process or out-of-process without rewriting their core logic. Status: draft
design note, not yet an ADR.

## [`research/`](./research/)

Scrutiny and refinement of the model above, done at different points as real
implementation gave real evidence to check it against:

- [`review-results.md`](./research/review-results.md) — an early review of the
  model against a limiter port/adapters sketch, before anything in the model was
  actually built.
- [`app-services-components-boundary.md`](./research/app-services-components-boundary.md) —
  revisits the model's "components are self-driven by bus subscription" premise
  after the Worker V2 build exercised a different shape in real code; proposes a
  narrower replacement rule.
- [`capability-modules.md`](./research/capability-modules.md) — names and defines
  a category for reusable, multi-port behavior that sits below both application
  services and components, worked out against `packages/artifacts` and checked
  against two other real/hypothetical cases.

## Per-component build plans

Concrete, phased plans that apply the model to one real package, written once a
plan is actually being executed:

- [`worker-v2/`](./worker-v2/) — the plan behind `packages/components/worker`'s
  rebuild (`worker-tools-artifacts` milestone, PRs 2–6, merged). Seeded from the
  model plus `review-results.md`.

Further plans (e.g. an artifacts migration) get added here the same way, as they
start.
