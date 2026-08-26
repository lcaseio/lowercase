# Milestones

One directory per milestone. See the convention below for shape, naming, and the section template every `MILESTONE.md`/PR entry follows. This doc is itself living — expect it to be revised as the pattern gets used for real, same as any `MILESTONE.md`.

## Milestones, in order

| #   | Milestone                     | Status                           | Where                                                                                        |
| --- | ----------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | ui-workspace                  | complete (v0.1.0-alpha.13, #339) | [`ui-workspace/MILESTONE.md`](./ui-workspace/MILESTONE.md)                                   |
| 2   | architecture-boundaries       | complete (#341–#346)             | [`architecture-boundaries/MILESTONE.md`](./architecture-boundaries/MILESTONE.md)             |
| 3   | events-refactor               | not started, scaffolded          | [`events-refactor/MILESTONE.md`](./events-refactor/MILESTONE.md)                             |
| 4   | json-schema-migration         | not started, scaffolded          | [`json-schema-migration/MILESTONE.md`](./json-schema-migration/MILESTONE.md)                 |
| 5   | rate-limiting                 | not started, scaffolded          | [`rate-limiting/MILESTONE.md`](./rate-limiting/MILESTONE.md)                                 |
| 6   | worker-tools-artifacts        | not started, scaffolded          | [`worker-tools-artifacts/MILESTONE.md`](./worker-tools-artifacts/MILESTONE.md)               |
| 7   | engine-hardening              | not started, scaffolded          | [`engine-hardening/MILESTONE.md`](./engine-hardening/MILESTONE.md)                           |
| 8   | runtime-storage-consolidation | not started, scaffolded          | [`runtime-storage-consolidation/MILESTONE.md`](./runtime-storage-consolidation/MILESTONE.md) |
| 9   | swappable-infrastructure      | not started, scaffolded          | [`swappable-infrastructure/MILESTONE.md`](./swappable-infrastructure/MILESTONE.md)           |
| 10  | evals                         | not started, scaffolded          | [`evals/MILESTONE.md`](./evals/MILESTONE.md)                                                 |

(Order here is start/intended-start order, not priority within a milestone — that's what each milestone's own `Next up` list is for.)

## Convention

**Location**: `docs/milestones/<name>/`, kebab-case.

**What stays top-level, outside `docs/milestones/`, and why**: `docs/todo.md`, `docs/adr/`, `docs/api-reference.md`, `docs/api-usage-audit.md`, `docs/observability.md` — things that outlive any single milestone. A bug found during one milestone is equally relevant during the next one; an ADR is a durable decision independent of which milestone produced it.

**`MILESTONE.md` section skeleton** (omit a section entirely until it has real content, never leave an empty stub):

- `Summary` — synchronic snapshot: what this milestone is/has built, as of now, stated as fact — the default home for "what's built today." Present tense, overview level, no history.
- `Evolution` — the chronological narrative of how the design got here: original plan, pivots, motivation, longer-term context not yet built. Optional while a milestone is young/thin — its few sentences can live briefly inside Summary until there's an actual pivot or backstory worth naming; split out once Summary would otherwise have to carry both "what it is" and "why it changed" at once. The PR index below is this narrative's detail layer — Evolution names the beats, individual PR entries carry the specifics behind each one. Expect to periodically re-summarize/compress it as it grows, the same recurring maintenance PR 36 established for the whole doc — a beat that's fully absorbed into Summary's present-tense description, or fully superseded by a later pivot, doesn't need to keep its own paragraph forever.
- `Design principles` — durable heuristics ongoing/future PRs should follow. Optional.
- `PR index` — table: `PR | Description | Status | Where | See also`.
- `Next up` — ordered, committed upcoming PR slots. Detail level tapers with distance: the next PR up gets real substance, ones further out are often just a title/one-liner.
- `Not yet scoped` — ideas with no PR number yet, no ordering commitment. This is also where "further out"/parking-lot material belongs — not its own section.
- `Skipped or superseded` — see below. Only present if a PR has actually hit the rare number-collision case.

**Satellite docs** (files beside `MILESTONE.md`, not inside `arcs/`) — two legitimate, different reasons, not one:

1. **Research** (`research/<topic>.md`) — pre-decision investigation: options considered, open questions, sometimes explicitly building toward a future ADR. Organized by question, not by PR. A genuinely ongoing category, not just an ADR-precursor.
2. **Pre-log sub-history** — a self-contained body of work with its own already-merged PR numbering that predates and is disjoint from this milestone's own PR sequence (e.g. a feature built standalone before the milestone's structured PR log existed, later migrated into it by a _separate_, later-numbered PR in the main log). Can't be folded into the PR index table without number collision — stays a permanent satellite regardless of how PR-chunked its own prose is internally.

Neither category should keep growing going forward for its own sake — (1) is legitimate indefinitely; (2) is closed by construction (nothing new can predate a log that already exists) and exists only because real content already does.

**`arcs/<descriptive-name>.md`** — zero or more, one per narratively-related group of PRs from this milestone's own numbered log. Never numbered filenames (the PR index table maps number → file, not filename order). A PR whose story doesn't fit its neighbors gets its own file. Content is written directly into its arc file from the moment it's written (during discussion, before planning) — never staged in `MILESTONE.md` first, even while a PR is still in progress.

**Arc file header, fixed shape:**

```markdown
# <Milestone> Milestone — Arc: <Title> (PRs N–M)

**Previous:** [<prior arc title>](./prior-arc.md) (PRs ...) · **Next:** [<next arc title>](./next-arc.md) (PRs ...)

Part of the [`MILESTONE.md`](../MILESTONE.md) PR log, split out to keep that doc scannable. <1-3 sentences: what this arc covers.>
```

The `Previous`/`Next` line is mechanical navigation, not narrative — order comes from each arc file's first appearance in the PR index, one file counted once even when its PRs are numerically interleaved with another arc's (e.g. an unrelated one-off PR landing in the middle of a longer arc's number range). Omit `Previous:` on the first arc file; omit `Next:` (or write "— none yet") on the most recent one. Keep this line separate from the descriptive paragraph below it — that paragraph can still explain non-adjacent or thematic relationships in prose (e.g. "this is PR 41's precondition, not its direct predecessor"); the header line is chain order only, always present, always the same shape.

**One PR entry, fixed shape, always nested under its own heading — never split across a separate floating section, regardless of length. Heading depth is contextual, not fixed**: the old, monolithic single-doc format's `####` was an artifact of nesting four levels into one giant file — inside a standalone `arcs/<name>.md` file, the file's own `#` title is the only thing above an entry, so `##` is enough. Pick the level that actually matches how deep the entry sits in whichever file it's in.

```markdown
## PR N - <Title> - <not started | in progress | merged (#N) | skipped>

<1-2 sentence framing>

### Discussion

[settled decisions; explicitly-deferred items; rejected alternatives — only if real]

### What actually landed

[matches design, or the deltas -- corrections, bugs found, scope changes]
```

Only `Discussion` and `What actually landed` are ever promoted to real headings — they're the two sections present in nearly every entry, in the same relative position, so they're worth being real jump-targets in an editor/GitHub outline. Everything more irregular (rejected alternatives, explicitly-deferred items, bugs found along the way) stays a bold lead-in inside one of those two, not its own heading. Omit `Discussion` entirely for a PR simple enough not to need it.

No date anywhere by default, header or body — not a hard rule, just don't inherit one from the last entry that happened to have one. Add a date when it's genuinely doing work (e.g. a real gap between discussion and build) — a judgment call each time, not a pattern to imitate.

**Skipped PRs — the normal path is a plain in-place entry, not a special section.** If a slot gets cancelled before anything past it is locked in (merged, or numbers otherwise depended on), just use `skipped` as this entry's own status, in place, number and all — same template as any other PR, `### What actually landed` renamed `### Why skipped`. This is the common case, and the one worth actively steering toward: reorder/renumber the still-forecast part of the log _before_ anything downstream becomes real, so a skip never has to fight an already-fixed number.

**Only when a number can't be freed without breaking already-real downstream numbers** — a **`Skipped or superseded`** section in `MILESTONE.md` (sibling to `Not yet scoped`, but for ideas that _did_ hold a real number before falling through, which `Not yet scoped` never did):

```markdown
## Skipped or superseded

### PR (originally N, no longer planned) - <Title> - skipped

[why, briefly]
```

This entry never appears as a row in the PR index table — its number belongs to whatever real PR N actually is now; a row here would collide with that.

**Plan Mode output (the actual implementation plan) is deliberately not archived anywhere.** It's the one workflow phase that doesn't produce durable doc content: by the time a plan gets written, `Discussion` should have already settled the _why_ (that's the point of discussing before planning), and `What actually landed` captures the _actual_ result afterward, including any deltas from what was planned. A full plan is bulk sitting between two already-distilled checkpoints — same shape of problem as a raw, undistilled research dump. If a plan ever contains something genuinely worth keeping that isn't already covered by `Discussion` or `What actually landed`, pull that specific piece into one of those two sections deliberately — don't keep the whole file as insurance.

**Scaffolding a new milestone**: create the directory + a `MILESTONE.md` with just `Summary` (even a one-paragraph placeholder) the moment it's named as real future work — doesn't need to wait for work to start.

## Workflow for a PR entry, per milestone's log

The rhythm every PR Log entry actually follows: discuss the idea informally first, sometimes at real length with research baked in and sometimes brief — then write the PR's idea down in its arc file, succinctly but completely enough to plan from (including for an AI picking this doc up cold later), _before_ any implementation plan gets made. Only after that: a real implementation plan, then building it, then reviewing/testing (typecheck/lint/test suite plus manual testing where applicable), then writing `What actually landed` (before or after opening the real PR — either order, whichever fits), then the PR itself, then marking the heading `- merged (#N)` once it's actually merged. The write-down-the-idea step is the one easiest to skip under time pressure — worth resisting, since it's what lets a plan get made from the doc alone later without re-deriving the discussion.
