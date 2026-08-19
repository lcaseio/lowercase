# UI Workspace Milestone — Arc: Documentation reorganization (PR 36)

Part of the [`MILESTONE.md`](../MILESTONE.md) PR log, split out to keep that doc scannable. Continues from [`replay.md`](./replay.md). A meta/process PR, not UI-substance work — this is the PR that actually builds the `docs/milestones/` structure every other arc file in this directory is an example of.

## PR 36 - Documentation reorganization - merged (#319)

Split this milestone doc into a repeatable per-milestone structure, before it grows past a comfortable size again.

### Discussion

**The problem, concretely**: this file already needed a PRs-1–8 archive split once, and had grown back to ~800 lines since. That's not a one-time cleanup, it's a recurring cost of the format itself — a single ever-growing living doc for an entire milestone's full history. This PR is a meta/process change, not UI-substance work: build a repeatable structure so this doesn't recur, and prove it out for real by migrating _this_ milestone into it now (not deferring to the next one) — the user's own framing: "its some churn but actually useful in extending what I'm building now and shows the pattern."

**Not an ADR.** Considered writing the convention as an ADR (mirroring ADR-0001's own dual role — documents the ADR convention and is one), but rejected: ADR-0004's own sequencing precedent (written only after PR 6/7 validated the shape in practice, not before) argues against freezing this before it's actually been used once. It's a plain, living `docs/milestones/README.md` instead; revisit ADR-ifying it only after this migration (and maybe one more milestone) has used it for real.

**The shape:**

```
docs/
  todo.md / adr/ / request-flow-map.md / observability.md   <- stay top-level, cross-cutting, untouched
  milestones/
    README.md                              <- milestone index (order = start/scaffold order) + the convention below
    ui-workspace/
      MILESTONE.md
      sims-mode.md                         <- was UI_SIMS_MODE.md, unreformatted
      artifacts-mode.md                    <- was UI_ARTIFACTS_MODE.md, unreformatted
      research/
        state-management.md                <- was UI_STATE_RESEARCH.md
      arcs/
        explorer-foundation.md             <- PRs 1-8 (was the old ARCHIVE.md). The old "Global workspace / navigation direction" section's origin-story half moved into this file's intro; its durable heuristics moved to MILESTONE.md's own Design principles section instead.
        right-panel-rail.md                <- PRs 9-13
        runs-and-sims-in-the-tree.md        <- PRs 14, 15, 18 (18 bundles here, not with 16-17 — it continues Sims' own thread, not EventGraph's)
        event-graph.md                      <- PRs 16, 17
        panel-icons-and-nav-rail.md         <- PRs 19, 20
        artifacts-in-explorer.md            <- PRs 21-24 (named distinctly from the satellite artifacts-mode.md — different, earlier body of work)
        run-input-params.md                 <- PRs 25, 26
        expand-content.md                   <- PRs 27, 28
        flow-graph-visual-rework.md         <- PRs 29-34
        replay.md                           <- PR 35
        documentation-reorganization.md     <- PR 36, this file
    evals/
      MILESTONE.md                          <- just Summary + Not yet scoped, scaffolded now even though work hasn't started
      eval-milestone.md                     <- was EVAL_MILESTONE.md
      eval-research.md                      <- was EVAL_RESEARCH.md, distilled later (see below), not moved verbatim
      arcs/                                 <- empty until real PRs exist
```

**What stays top-level and why**: things that outlive any single push — a bug found during this UI milestone is equally relevant during the next one, an ADR is a durable decision independent of which milestone produced it. Nothing about this reorganization touches them.

**Why migrate the current milestone now instead of starting the pattern with the next one**: doing it now means there's a real, working example to literally copy when starting `evals/`, not just a convention described in the abstract. Chosen despite the real churn — decided, not a default.

**`MILESTONE.md`'s section skeleton** — omit a section entirely until it has real content, never an empty stub: `Summary` (merges the old Summary + "Overall idea and purpose"; also where the flow-version→dockview-workspace pivot gets named in prose — the doc's own title stays untouched on purpose, same as this doc never rewrites past design bullets to hide a pivot), `Current state` (was "What's already built" + the Sims/Artifacts pointers), `Design principles` (the surviving heuristics from "Global workspace / navigation direction" — picker-vs-browse, tree-position disambiguation, list-scale-via-search-not-tree, etc.), `PR index`, `Next up`, `Not yet scoped` (merges "Other bits of work" + "Candidate next chunks" + both "Further out" sections into one place instead of four scattered headings).

**Satellite docs — two legitimate categories, not one:**

1. `research/<topic>.md` — pre-decision investigation, organized by question not by PR, an ongoing category (not just an ADR-precursor).
2. Pre-log sub-history (`sims-mode.md`, `artifacts-mode.md`) — self-contained, already-merged PR sequences (#265–269, #272–283) that finished entirely _before_ this milestone's own log started (both predate PR 1, #284). Can't join the PR index without a number collision, regardless of how PR-chunked their own prose is internally — Artifacts mode's later entries (PR 4c on) already read almost exactly like an arc entry, kept unreformatted anyway since the numbering problem alone settles it. Stay flat siblings of `MILESTONE.md`, not nested in `arcs/`. This category is closed by construction — nothing new can predate a log that already exists.

**One PR entry, fixed shape, heading depth contextual (one level below whatever's directly above — `##` in a standalone arc file, `###` if nested inside `MILESTONE.md`'s own section), never the old `####` carried over out of habit:**

```markdown
## PR N - <Title> - <not started | in progress | merged (#N) | skipped>

<1-2 sentence framing>

### Discussion

[settled decisions, deferred items, rejected alternatives — only if real]

### What actually landed

[matches design, or the deltas]
```

Only `Discussion` and `What actually landed` are real headings — genuine per-entry anchors present in nearly every PR. Everything more occasional (rejected alternatives, explicitly-deferred items, bugs found along the way) stays a bold lead-in nested inside one of those two, not its own heading. Omit `Discussion` for a PR simple enough not to need it. No date anywhere by default, header or body — add one only when it's genuinely disambiguating, never by imitating whichever prior entry happened to have one. (This file's own history: an inline date first crept into PR 29's body, spread into several "Further out" notes after it, then became header-level once PR 35/36's discussions grew long enough to need their own floating section, separated from their own PR's `merged (#N)` marker — a structural cause, which this fixed, single-section template removes at the root rather than needing a separate rule to police.)

**Skipped PRs — default is in-place, own number kept.** `skipped` as the entry's own status, `What actually landed` renamed `Why skipped`, no renumbering cascade — the goal is to actively reorder the still-forecast sequence _before_ anything downstream becomes real, so this is the common case, same operation `Next up` already performs on every reorder. Only when a number is already unfreeable (real precedent: PR 8 was going to be "Workspaces," but PRs 9+ already existed by the time it was cancelled) does it move to a dedicated `Skipped or superseded` section in `MILESTONE.md`, labeled `PR (originally N, no longer planned)` — and it never gets a row in the PR index table, since its number belongs to whatever real PR N actually is now.

**Plan Mode's own implementation-plan output is never archived anywhere.** `Discussion` already settles the why beforehand, `What actually landed` captures the real result afterward — the plan itself is bulk sitting between two things already deliberately kept, the same shape of problem as an undistilled research dump.

**Evals gets scaffolded as its own milestone now, not left as a section in this doc.** `EVAL_RESEARCH.md` is a raw, unedited LLM chat copy-paste (confirmed directly — opens "Yes — this is exactly the right shape for your engine," with bracket-style citations) and needs real distillation, not a verbatim move. Bundled into this PR rather than its own, staged: trimmed by the user first, then distilled for real into `evals/eval-research.md`.

**The arc split for PRs 9–28 is resolved, not deferred to execution** — governing principle: **narrative relatedness, not a fixed PR-count-per-file rule**: group PRs whose story is genuinely one continuous arc told in installments; leave a PR to its own file when it's genuinely standalone. Final shape (see the tree above): PRs 14/15/18 together (18 continues Sims' own thread from 15, not EventGraph's from 16-17); 16/17 on their own; 19/20 on their own, split from 21-24 (Artifacts mode is its own coherent four-PR story and doesn't need 19/20's unrelated panel-icon/nav-rail work bundled in); 25/26 on their own, split from 27/28 (run-input-params and expand-content are two different features that happen to be numerically adjacent, not one story).

**`arcs/` filenames are descriptive, never numbered.** No `01-`/`02-` prefix — the PR index table is what makes "which file has PR 16" answerable, not filesystem sort order. Numbered prefixes would also fight the "group by relatedness, not fixed count" principle, since inserting a rediscovered arc later would force renumbering.

**The PR index table — lives inside `MILESTONE.md`, near the top, not a separate file.** A markdown table (style matches this repo's own `README.md` package table — aligned pipes, short phrases), one row per PR number, covering _all_ PRs from 1 through current, not just archived ones:

| PR  | Description                                          | Status        | Where                      |
| --- | ---------------------------------------------------- | ------------- | -------------------------- |
| 9   | Right Panel Icon Rail (Params/Sim migrated first)    | merged (#292) | `arcs/right-panel-rail.md` |
| 16  | EventGraph, spawned from the Flow Graph panel itself | merged (#299) | `arcs/event-graph.md`      |
| 35  | Flow graph replay for completed runs                 | merged (#318) | `arcs/replay.md`           |

Columns, in order of how essential they are:

- **PR** and **Description** — description is the same density already used in every existing PR Log header, not a new, longer summary. Deliberately no separate "longer summary" tier beyond this.
- **Status** — reuse the exact string each entry's own header already carries (`merged (#292)`, `skipped`, etc.) verbatim, not a new format.
- **Where** — the `arcs/` (or satellite) file containing the full entry. No content ever stays inline in `MILESTONE.md` itself, even while a PR is still in progress — this is the field that makes a non-numbered filename convention work at all.
- **See also** (fifth column, added only to rows that need it, blank on most) — a genuinely optional pointer to a non-obvious related PR, e.g. PR 35's row would list "PR 16 (EventGraph singleton design)". Carries only a pointer, never the reasoning. Populating this for PRs 1–35 retroactively is a real, bounded writing task — natural to do while reading each entry closely during the archive move anyway, not a separate pass.

**On PR numbers vs. GitHub PR numbers — deliberately kept as two separate, parallel systems, not unified.** The GitHub number is assigned atomically the instant a PR is actually opened, is a repo-wide counter shared with unrelated work, and can't be predicted or reserved in advance. This doc's own "PR N" is a milestone-relative planning sequence, assigned as soon as a unit of work is named as its own thing — its value is being a clean, gap-free, milestone-scoped ordering, which trying to rename to match GitHub's numbers after the fact would destroy. Keep recording both together at merge time, exactly as already done (`- merged (#318)`).

**Scope of this PR, concretely:**

- Create `docs/milestones/`, write `docs/milestones/README.md` (the convention above, plus a milestone-order index table).
- Move `UI_WORKSPACE_MILESTONE.md` → `docs/milestones/ui-workspace/MILESTONE.md`, rebuilt into the section skeleton above.
- Move `UI_SIMS_MODE.md`/`UI_ARTIFACTS_MODE.md` in unreformatted; move+rename `UI_STATE_RESEARCH.md` → `research/state-management.md`.
- Move/rename the existing PR 1–8 archive (`UI_WORKSPACE_MILESTONE_ARCHIVE.md`) into `arcs/explorer-foundation.md`; split PRs 9–34 into the eight `arcs/` files listed in the tree above.
- Build the PR index table (PRs 1 through current, with `See also`) inside `MILESTONE.md`, near the top.
- Scaffold `docs/milestones/evals/` (`MILESTONE.md` with just `Summary` + `Not yet scoped`); move+rename `EVAL_MILESTONE.md`/`EVAL_RESEARCH.md` in; distill the latter's content for real once the user has trimmed it.
- Update every relative link/cross-reference this move touches — the pointer lines this main doc already has for archived PRs, any reference from `docs/todo.md`, and check memory for any stored path to the old file location.
- Explicitly out of scope: no UI-workspace substance/code changes at all — purely a documentation/organization change. `docs/todo.md`, `docs/adr/`, `docs/request-flow-map.md`, `docs/observability.md` untouched.

### What actually landed

The design above landed essentially as planned — the full `docs/milestones/` tree, all 36 PR entries (1 through 35, plus this one) reformatted to the `## PR N` / `### Discussion` / `### What actually landed` template, `docs/milestones/README.md` written, `evals/` scaffolded — plus a few real decisions and deltas made during execution, not settled at design time:

- **Reformat scope, confirmed rather than assumed**: the design's own template section already implied PRs 1–35 should all be reformatted, but the "scope of this PR" bullets and effort estimate only explicitly covered 9–34. Confirmed with the user before starting: yes, reformat PR 1–8 and PR 35 too, for consistency across every arc file rather than leaving two visibly older-shaped exceptions.
- **The "Global workspace" section's origin-story half didn't fully relocate as planned.** The design said it would move into `explorer-foundation.md`'s own intro; in practice it was condensed into a shorter note inside `MILESTONE.md`'s `Summary` instead (the pivot itself — "started as a flow-version-scoped idea, settled into a dockview panel/tree shell" — is still named, just not with the full original Postman-research narrative alongside it). A real scope trim, not an oversight; worth expanding later if the fuller narrative is missed.
- **PR 38/39/41's "Further out" write-ups stayed in `Not yet scoped` rather than becoming their own `arcs/` files.** They have real substance and assigned numbers in `Next up`, but no actual PR has started yet — arc files are for narrated build history, not pre-work staging, so this was a deliberate line to hold rather than over-scope the move.
- **`eval-research.md`'s distillation happened as part of this PR, once the user's own trim was in hand** — removing residual "you"-addressed phrasing, a broken numbered list left over from trimming, one section still shaped like raw chat output (bare type names in code fences), typos, and non-ASCII curly quotes throughout. A first attempt at the curly-quote cleanup used a `sed` character-class substitution that corrupted the file's multi-byte characters into garbage bytes — caught immediately, the file was rewritten cleanly from the pre-corruption version with every fix reapplied by hand, verified byte-clean afterward.
- **The cross-reference sweep found a few more mentions than the initial repo-wide search estimated** (`docs/todo.md` in particular), and 13 personal-memory files needed the same path updates, not the ~11 originally flagged — both fixed as part of the same pass, not treated as a separate follow-up.
- **One memory got a real content revision, not just a path fix**: `project_milestone_doc_dual_purpose_tension` described the exact human-narrative-vs-AI-context-density tension this PR resolves, and previously said not to propose a fix unprompted. Updated to record that the tension is now resolved (by this PR) rather than leaving it as an open question a future session might still tiptoe around.
- **Verification**: `pnpm typecheck` (25/25 packages), `pnpm lint` (26/26), and `apps/web-app`'s vitest suite (278/278 tests) all passed clean; every touched code file's diff was confirmed by eye to be comment/string-only, no logic changes. A repo-wide grep for every old filename returned zero hits afterward, aside from this entry's own intentional "was X.md" migration notes.
- `docs/UI_WORKSPACE_MILESTONE.md` and the other five old top-level docs were removed via `git rm -f` only after confirming every section had a real new home — nothing was committed as part of this work; that was left for the user to do themselves.
