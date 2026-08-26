# Events Package Refactor

## Summary

Refactor `packages/events` — originally scoped narrowly around `EmitterFactory`'s boilerplate (self-documented in its own doc comment as "currently in between being refactored"), now aimed at a new event-emission core: a single generic `emit()` function, context (scope/trace/span) handled via propagation rather than per-domain construction, and a span-per-entity-occurrence model — replacing the current per-domain-class architecture rather than incrementally DRYing it up.

Whether the hand-rolled Zod event/data schemas (`*.event.schema.ts`/`*.data.schema.ts`) get folded into this same milestone, stay scoped to `json-schema-migration` separately, or `packages/specs` joins too, is explicitly undecided — this starts as its own thing, scope grows from there rather than being decided up front.

Full research/discussion behind everything below: [`research/history-and-current-shape.md`](./research/history-and-current-shape.md).

## Evolution

Originally scoped as possibly folding into `json-schema-migration`'s "hand-rolled Zod schemas" problem, since both live in `packages/events`. Split into its own milestone instead once it became clear the `EmitterFactory` boilerplate (the primary thing motivating picking this up now) and the schema-format question (Zod vs. JSON Schema) are genuinely different units of work, not one problem — that's separate, though, from whether they belong in one milestone or two. A milestone can hold more than one unit of work; whether this stays split from `json-schema-migration` or the two get combined is a real, still-open question of size and pacing, not a closed decision — the door stays open to combining them at the milestone level even though the underlying work is being kept cleanly separable either way.

Started with a long discussion-first research pass across the whole of `packages/events` (and the parts of `packages/types` it depends on) before any PR was planned — covering the type-level DX-driven design origin, the Cloud Events + OpenTelemetry/W3C Trace Context envelope history, the confirmed-dead-but-fully-wired span-nesting capability, `EmitterFactory`/`BaseEmitter`/the ten domain emitter classes, and the registries/parsers — written up in [`research/history-and-current-shape.md`](./research/history-and-current-shape.md). That surfaced an initial natural split: three mechanical, low-risk cleanup targets that don't depend on resolving the harder open design question (the nested-span strategy, at that point still genuinely unresolved), plus two items deliberately left unscoped.

**That initial split was then superseded before PR 1 even started building.** Discussing PR 1's implementation directly (rather than just outlining it) surfaced that the three cleanup targets were symptoms of one architecture, not three separate problems, and that a genuinely new core (single `emit()`, context propagation instead of per-domain construction) dissolves what the other two PRs would have fixed rather than requiring them as separate steps. That same discussion also produced a real answer to the previously-unresolved nested-span question — span identity keyed to entity occurrence, parent found by reference rather than a stack or coordinator — which is now part of PR 1's scope instead of a deferred open question. PR 1 was rescoped in place (arc file replaced, not amended) to reflect this rather than kept as a stale plan next to a changed discussion.

## PR index

| PR  | Description                                       | Status      | Where                                     | See also                                                |
| --- | -------------------------------------------------- | ----------- | ------------------------------------------ | -------------------------------------------------------- |
| 1   | Event-emission core: single `emit()`, context propagation, span-per-entity model | in progress | [`arcs/event-emission-core.md`](./arcs/event-emission-core.md) | [`research/history-and-current-shape.md`](./research/history-and-current-shape.md) |

## Next up

1. **Prove the core out on a real usage: wire `step` emission in the engine onto `emit()`/`deriveScope()`.** Deliberately narrow — chosen because it exercises both the normal completed/failed path and `step.reused`'s short-span path in one domain. Real DX feedback from this decides whether `emit()` alone is enough or whether named variants (`emitFromEvent()` or similar) are actually needed — not designed ahead of that. No arc file yet.

## Not yet scoped

- **`event-schema.registry.ts`/`category.registry.ts`/`event-types.ts`'s hand-maintained schema/type wiring.** Real overlap with `json-schema-migration` (this is exactly the hand-rolled-Zod-schemas problem that milestone names). Whether this becomes a later PR of this milestone or moves into that one entirely is undecided.
- **Broader adoption beyond the `step` proof** (`worker`, `router`, `limiter`, etc.) — deliberately not committed as ordered milestone PRs yet. A real open strategic question: migrate these as their own dedicated pass, or defer most of it to each subsystem's own future refactor (a broader refactor of `packages/*` beyond just `events` is a real, separately-intended future direction), since migrating a call site now that gets rewritten again during that system's own refactor could just be redone work. Leaning toward deferring, not settled.
- **A principled, consistent answer for what belongs in the envelope header vs. `data`.** Not applied consistently today (see research doc) — sometimes deliberately duplicated as an experiment, sometimes header-only, sometimes `data`-only; `LimiterScope` keeping its ids in `data` is one concrete instance. A real future goal to derive an actual rule and align existing events to it. Not scoped or started.

Scaffolded now, not yet scoped in full detail.
