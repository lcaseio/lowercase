# Worker/Tool Extensibility Model — Research Toward a Future ADR

## Purpose

This is pre-ADR research, not a decision record. It's a placeholder for now — seeded with what's already been flagged in `CLAUDE.md` and `docs/todo.md`, not yet a real discussion thread. Fill in as that discussion happens.

Referenced from `docs/milestones/architecture-boundaries/MILESTONE.md`, not duplicated there. Related to [`package-tier-taxonomy.md`](./package-tier-taxonomy.md) — where tools end up living (their own tier, "component pieces," or something else) depends on what gets decided here, not the other way around.

## The problem

The capability/tool-registry extensibility vision — a tool declares a capability like `httpjson`, a registry tracks what's available, a step's `tool` field selects an implementation — is real and partially built (`StepCapCommonFields.tool?`, `ToolRegistry`, `allToolBindingsMap`), but has never been proven out by a second real capability beyond `httpjson`/`mcp` (and `mcp` itself is of doubtful runtime reliability today, per `CLAUDE.md`).

The worker/tool interaction model itself is unsettled, not just under-exercised: the full result payload currently rides inside the `job.<capability>.completed`/`failed` event rather than being kept out of it (`CLAUDE.md`). Tools are meant to be the primary extension point for this project, and the current shape may not be right.

## Open question: in-process vs. out-of-process tools

Genuinely undecided. Tools may not need to be in-process with the worker at all — a "tool" could be an out-of-process HTTP service the worker calls, with a possible SDK package (event-parsing helpers, response-shape helpers) letting a third party build a tool as a standalone service without forking or extending this repo's code at all.

This choice would change where two other boundaries need to sit, not just the tool-invocation mechanism itself:

- **The worker/tool payload boundary** — how much of a job's data actually needs to cross into the tool vs. stay worker-side.
- **The secrets-safety boundary.** Real credentials for external APIs aren't safe to use yet: a flow step's `headers`/`body` get fully resolved (including anything credential-shaped) before `job.<capability>.started` is emitted, so a real secret currently flows straight into the replay log and the web app's event viewer — already demonstrated with a placeholder value showing up verbatim in a pasted event. One candidate fix floated: resolve a `secrets` ref scope at the worker level (not the tool level), handing the tool a fully hydrated payload directly while separately emitting a redacted event to the bus. That candidate assumed today's in-process, single-payload invocation shape — worth revisiting once in-process vs. out-of-process is actually decided, since it may not be the right shape either way.

## Not yet discussed

Everything else: what the registry/binding model should actually look like once proven by a second capability, what an SDK package would need to expose, how this interacts with `packages/worker`'s already-acknowledged internal complexity and bloat, and how deep a rework this implies for `packages/tools`'s own contract.

## Open questions, explicitly not yet resolved

- In-process vs. out-of-process tools — the central question this doc exists to answer.
- Where the worker/tool payload boundary and the secrets-safety boundary actually need to sit, once the above is settled.
- Whether `mcp` stays a real second capability worth proving the registry against, or whether that role falls to something else given its doubtful runtime reliability.
