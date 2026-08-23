# Workbench UI Rework

**Status: In progress — closing out via PRs 54–56.**

## Summary

`apps/web-app` is a dockview-based **Workbench**: a persistent shell with a left-side **FlowExplorer** tree (Flows → Versions, with Runs/Sims/Artifacts nested under each version) and a **Dock** of open/closeable/draggable panels — Flow Graph, Event Graph, artifacts, flow authoring, step results, and more — plus a Postman-style right-rail (Parameters, Run Input, Simulate, Problems, Step Details, Step Results, Settings) that follows whichever panel is focused. It replaced a page-navigation web app where nearly everything lived at a global "list all runs / list all sims / list all artifacts" level, with no real organizing entity underneath it; the actual daily unit of work is one specific flow version, drilled into via panels/tabs inside one persistent shell, not separate top-level pages.

Panel state — params, run selection, side-panel tab, layout direction, viewport, replay position, and more — persists across tab switches, in-app navigation away and back, and a real reload, via a keyed Redux slice per panel kind, persisted to `sessionStorage`/`localStorage`. Full reasoning trail in [`research/state-management.md`](./research/state-management.md), distilled decision in `docs/adr/0004-panel-state-management-and-persistence.md`.

The old page-based flow-version-mode-nav system (Edit/View/Run/Run History/Sims/Artifacts/Evals as separate routed pages) was fully deleted (PRs 42–45) once the Workbench covered its ground. Evals stayed out of scope on purpose — it's its own separate milestone (`docs/milestones/evals/`).

## Evolution

### The original plan

This doc originally set out a plan: drill into one flow version, and work with it entirely through panels/tabs for whichever mode you're in (Edit, View, Run, Run History, Sims, Artifacts, Evals) — rather than navigating to separate top-level pages for runs/sims/artifacts/evals that all have to be manually cross-referenced by id. That plan didn't survive contact with the actual build, below.

Not everything was equally fleshed out along the way. The point of writing this doc as it went was to capture the parts that were settled (so they wouldn't need re-deriving later) and name the parts that weren't (so they'd read as open, not forgotten). It never mapped to a single GitHub Milestone or version bump — each concrete chunk was its own small, closeable unit, with this doc as the throughline connecting them.

### The pivot

**The design pivoted partway through, on purpose — worth naming rather than quietly editing away.** This milestone started out as a "Flow-Version Workspace" idea: one flow version as the primary context, with modes (Edit/View/Run/...) inside it. Actually building the Explorer/dockview arc (PRs 1 onward) settled into something related but different: a dockview panel/tree shell where _you_ arrange your own workspace — multiple panels, any versions/runs/sims side by side, not one fixed per-version mode at a time. "Workspace" survived the pivot itself unchanged, and the doc's title stayed as originally written through it, on purpose, matching this doc's own habit of recording deltas rather than rewriting history to look like it was always this way. It was retitled later regardless (2026-08-23, see Summary above) — not to erase that history, but because "Workspace" went on to collide with a different, specific meaning PR 47's naming pass reserved for it.

One instinct from that early period held up in retrospect: deliberately not adopting a docking/tab-management library until the simple skeleton's real limits were actually felt. This played out for real — `dockview` was adopted in PR 5, only after PR 2–4's hand-rolled tab registry hit a real, felt limit — confirming the instinct was right, not just cautious.

### Sims and Artifacts, folded in

**Two pieces of today's Workbench predate the Explorer/dockview arc entirely — and how they got folded in is more precise than "migrated."** Sims mode and Artifacts mode were each fully built earlier, as their own standalone PR sequences, as real separate top-level pages/modes — full design narratives in [`sims-mode.md`](./sims-mode.md) and [`artifacts-mode.md`](./artifacts-mode.md). Once the Explorer tree existed, the _mode_ itself didn't survive — neither kept its own top-level page — but their actual pieces (list views, detail views, forms) were reused and adapted, becoming tree branches and panels inside the Workbench instead: Sims during PR 15/18, Artifacts during PRs 21–24. Neither has its own row in the PR index below — they aren't part of _this_ PR sequence, but they're real prior work this milestone absorbed and reshaped, not built from within it. (Artifacts' payoff still isn't fully cashed in: the curated/associated artifact set is meant to replace the fully-unfiltered global artifact list some pickers still draw from — tracked in `docs/todo.md`.)

### Longer-term context

Worth keeping in view even though it's not being built yet: the eventual target runtime is Electron (not just a browser tab), with real multi-pane coexistence (view + edit + preview at once, like an IDE) rather than one panel at a time, and an explicit non-goal of supporting small/phone-sized screens. Also an explicit constraint: this UI is being hand-designed and understood, not generated wholesale by an AI/design tool in one shot, the same ownership stance as the rest of this codebase.

## Design principles

Durable guidance for this arc's ongoing and future work, carried over from the "Global workspace / navigation direction" discussion that motivated the original Explorer pivot (PR 1 onward) — the origin-story half of that discussion now lives in [`arcs/explorer-foundation.md`](./arcs/explorer-foundation.md)'s own intro; this is just the guidance that's still actively load-bearing.

### Tree & browsing

- **The concrete shape being aimed at: a left-side FlowExplorer tree (Flows → Versions → Runs/Artifacts/Sims) plus a dynamic tab/panel system, with a detail panel that follows the active tab.** Deliberately _not_ a flat global "all artifacts" browser — scoped browsing, nested under the flow/version that owns it. A true flat global browse, if ever built, is a different root in the same tree. (Evals isn't a branch here — it's its own separate milestone, not part of this tree.)
- **A working heuristic for sorting which modes become tree branches vs. stay closer to a standalone action**: is this fundamentally _a list you browse, then open something from_, or fundamentally _a distinct workflow/action_ that doesn't reduce to browse-then-open? Artifacts and Runs (a version's historical runs) read as the first kind; triggering a _new_ run reads more like the second.
- **Naming collisions across scope levels are resolved structurally by tree position, not by inventing different words.** A node nested under a specific flow version's branch is unambiguous by where it sits in the tree.
- **List scale/navigability is deliberately deferred, and solved by a different mechanism than the tree itself** — a huge folder isn't made navigable by better tree design, it's made navigable by pairing the tree with a separate fuzzy filter/search that skips the hierarchy entirely. Not worth building before there's enough real content for it to bite.
- **Picker-mode vs. browse-mode clicks is a real, already-solved-elsewhere interaction pattern** — a dumb component driven entirely by whichever callback prop the caller wires up (`onOpen` vs. `onSelect`), not a new pattern to invent.

### State & panels

- **State/lifecycle implication, genuinely underappreciated at first**: a tab that's merely hidden and re-shown never unmounts the way a real route change used to. Patterns built assuming real unmount/remount timing need rethinking, not just porting. A singleton slice assuming exactly one "current" thing stops being coherent once multiple tabs of the same content type can be open at once — a keyed-by-panel-id slice is the general fix, already the established pattern in this codebase (see `research/state-management.md`).

### Visual & audience

- **Visual direction: shift from web-page density toward desktop-tool density is three separable things, not one dial** — padding/type scale; information architecture (how much shows by default vs. on demand); interaction model (small toolbar-icon actions instead of large always-visible CTA buttons). A traditional top menu bar is explicitly not the starting interaction model.
- **Audience/positioning**: this is primarily a developer/orchestration tool. "Friendly to non-technical people" is scoped specifically to _installation_ (the Electron packaging goal), not to simplifying the feature set or this UI's density.

## PR index

| PR  | Description                                                                           | Status        | Where                                  | See also                              |
| --- | ------------------------------------------------------------------------------------- | ------------- | -------------------------------------- | ------------------------------------- |
| 1   | Explorer Mini Spike                                                                   | merged (#284) | `arcs/explorer-foundation.md`          |                                       |
| 2   | Tab/Panel Skeleton                                                                    | merged (#285) | `arcs/explorer-foundation.md`          |                                       |
| 3   | Content In Tab                                                                        | merged (#286) | `arcs/explorer-foundation.md`          |                                       |
| 4   | Run Toolbar + Right Panel                                                             | merged (#287) | `arcs/explorer-foundation.md`          |                                       |
| 5   | Dockview Added and Implemented                                                        | merged (#288) | `arcs/explorer-foundation.md`          |                                       |
| 6   | Migrate Flow Graph Panel State to Redux                                               | merged (#289) | `arcs/explorer-foundation.md`          | `research/state-management.md`        |
| 7   | Serialize Redux State + Dockview Layout                                               | merged (#290) | `arcs/explorer-foundation.md`          | `research/state-management.md`        |
| 8   | ADR-0004: Panel State Management and Persistence                                      | merged (#291) | `arcs/explorer-foundation.md`          | `docs/adr/0004-...`                   |
| 9   | Right Panel Icon Rail (Params/Sim migrated first)                                     | merged (#292) | `arcs/right-panel-rail.md`             |                                       |
| 10  | Problems + Parameters migrated to the rail                                            | merged (#293) | `arcs/right-panel-rail.md`             |                                       |
| 11  | Step Details migrated to the rail                                                     | merged (#294) | `arcs/right-panel-rail.md`             |                                       |
| 12  | Settings migrated to the rail, removed from the tree                                  | merged (#295) | `arcs/right-panel-rail.md`             |                                       |
| 13  | Step Results migrated to the rail                                                     | merged (#296) | `arcs/right-panel-rail.md`             |                                       |
| 14  | Runs list in the tree, each run opens its own Flow Graph panel                        | merged (#297) | `arcs/runs-and-sims-in-the-tree.md`    |                                       |
| 15  | Sims list in the tree, click opens a sim in its own Flow Graph panel                  | merged (#298) | `arcs/runs-and-sims-in-the-tree.md`    |                                       |
| 16  | EventGraph, spawned from the Flow Graph panel itself                                  | merged (#299) | `arcs/event-graph.md`                  | PR 35 (replay stretch goal)           |
| 17  | Event Details side panel for the Event Graph                                          | merged (#300) | `arcs/event-graph.md`                  |                                       |
| 18  | Simulate — author a sim from a run                                                    | merged (#301) | `arcs/runs-and-sims-in-the-tree.md`    |                                       |
| 19  | Panel/tab identity icons                                                              | merged (#302) | `arcs/panel-icons-and-nav-rail.md`     |                                       |
| 20  | Postman-style fixed-width main nav rail                                               | merged (#303) | `arcs/panel-icons-and-nav-rail.md`     |                                       |
| 21  | Artifacts — first piece: list per-version artifacts in the tree                       | merged (#304) | `arcs/artifacts-in-explorer.md`        |                                       |
| 22  | Artifacts — view an artifact                                                          | merged (#305) | `arcs/artifacts-in-explorer.md`        |                                       |
| 23  | Artifacts — rail + metadata tab (view + edit)                                         | merged (#306) | `arcs/artifacts-in-explorer.md`        |                                       |
| 24  | Artifacts — create an artifact                                                        | merged (#307) | `arcs/artifacts-in-explorer.md`        |                                       |
| 25  | Run Input Params — run-opened panels are read-only, always a rerun                    | merged (#308) | `arcs/run-input-params.md`             |                                       |
| 26  | Run Input Params — curated picker for sim-opened and plain panels                     | merged (#309) | `arcs/run-input-params.md`             |                                       |
| 27  | Expand content into its own tab, part 1 — real artifacts                              | merged (#310) | `arcs/expand-content.md`               |                                       |
| 28  | Expand content into its own tab, part 2 — navigate into the definition, event payload | merged (#311) | `arcs/expand-content.md`               |                                       |
| 29  | Flow graph — swap to a real layout library (dagre), two layouts                       | merged (#312) | `arcs/flow-graph-visual-rework.md`     |                                       |
| 30  | Flow graph — one toolbar, fix fitView                                                 | merged (#313) | `arcs/flow-graph-visual-rework.md`     |                                       |
| 31  | Flow graph — custom node types                                                        | merged (#314) | `arcs/flow-graph-visual-rework.md`     |                                       |
| 32  | Flow graph — custom nodes for mcp + join                                              | merged (#315) | `arcs/flow-graph-visual-rework.md`     |                                       |
| 33  | Flow graph — branch/parallel node handling                                            | merged (#316) | `arcs/flow-graph-visual-rework.md`     |                                       |
| 34  | Flow graph — branch step details + side-panel field visual polish                     | merged (#317) | `arcs/flow-graph-visual-rework.md`     |                                       |
| 35  | Flow graph — replay                                                                   | merged (#318) | `arcs/replay.md`                       | PR 16 (EventGraph singleton design)   |
| 36  | Documentation reorganization                                                          | merged (#319) | `arcs/documentation-reorganization.md` |                                       |
| 37  | Sync the EventGraph panel with Flow Graph replay                                      | merged (#320) | `arcs/replay.md`                       | PR 35 (Replay)                        |
| 38  | Basic flow authoring in the modern dockview UI, from the tree                         | merged (#321) | `arcs/flow-authoring.md`               | PR 24 (artifact authoring)            |
| 39  | Fix CodeEditor (Monaco) spacebar input bug                                            | merged (#322) | `arcs/code-editor-spacebar-bug.md`     |                                       |
| 40  | Replace the WebSocket live-events transport with SSE                                  | merged (#323) | `arcs/websocket-to-sse.md`             |                                       |
| 41  | Show the sim/reuse badge on runs that actually reused steps                           | merged (#324) | `arcs/sim-reuse-badge.md`              | PRs 29-34 (flow graph visual rework)  |
| 42  | Prune old pages — dead-code sweep (zero-risk, no page dependency)                     | merged (#325) | `arcs/prune-old-pages.md`              |                                       |
| 43  | Prune old pages — Runner/RunDetails/Runs cluster, rescue EvaluateExportModal first    | merged (#326) | `arcs/prune-old-pages.md`              |                                       |
| 44  | Prune old pages — Sims/CreateSim/ViewSim + Artifacts.tsx clusters                     | merged (#327) | `arcs/prune-old-pages.md`              |                                       |
| 45  | Prune old pages — Flows/FlowVersion-mode-pages cluster (deletion only)                | merged (#328) | `arcs/prune-old-pages.md`              |                                       |
| 46  | Rehome shared survivors out of old flow-version/top-level component tree              | merged (#329) | `arcs/prune-old-pages.md`              | `arcs/workbench-naming.md`            |
| 47  | Rename Explorer → Workbench/Dock/FlowExplorer                                         | merged (#330) | `arcs/workbench-naming.md`             | PR 46                                 |
| 48  | `flow-graph-panel` internal split + `shared/flow-graph/` kit                          | merged (#331) | `arcs/workbench-naming.md`             |                                       |
| 49  | Remaining structure review, outside `components/`                                     | merged (#332) | `arcs/remaining-structure.md`          |                                       |
| 50  | CSS visual polish + theme logic review                                                | merged (#333) | `arcs/theme-and-visual-polish.md`      | PR 49                                 |
| 51  | Server API reference, swagger-style (`docs/api-reference.md`)                         | merged (#334) | `arcs/api-reference-docs.md`           | PR 52 (retired `request-flow-map.md`) |
| 52  | Web app endpoint usage audit (`docs/api-usage-audit.md`)                              | merged (#335) | `arcs/api-usage-audit.md`              | PR 51                                 |
| 53  | Activate `apps/web-app`'s real production build                                       | merged (#336) | `arcs/production-build.md`             |                                       |
| 54  | `apps/web-app` + `apps/http-server` READMEs, real content                             | in progress   | `arcs/web-app-readme.md`               |                                       |
| 55  | Comment pass — fresh sweep, scope TBD                                                 | tentative     | `MILESTONE.md` (Next up)               |                                       |
| 56  | Repo version bump, prep for merge to `main`                                           | tentative     | `MILESTONE.md` (Next up)               |                                       |

## Next up

Real order, not just a bucket of candidates — but explicitly changeable. Several of these already have fuller write-ups in `Not yet scoped` below or in `docs/todo.md`; this list is the sequencing commitment, with context necessary before committing to an arc file, not a duplicate of existing detail.

### PR 54 - 56

- **PR 54 — `apps/web-app` README, real content.** Now has its own arc file, [`arcs/web-app-readme.md`](./arcs/web-app-readme.md) — see there for full discussion.

- **PR 55 — a comment pass across the codebase, scope not yet determined.** Split out from PR 54 (2026-08-23) once it became clear the two were different kinds of review (docs content vs. cross-file code comment correctness), and that the comment pass's real scope isn't just the flow-graph code (PRs 29–34) it had defaulted to living under — that default followed from PR 54's own trace-reading touching that code anyway, not from where the need is actually greatest. Original trigger for flagging this is lost and not worth rediscovering; some impacted files are already known, but this needs a fresh sweep to actually scope before it's plannable. Not yet an arc file.

- **PR 56 — repo version bump, root `README.md` updated, prep for merge to `main`.** Named 2026-08-22 as this milestone's actual close-out. Not scoped beyond the name yet.

## Not yet scoped

Ideas with no PR number yet, no ordering commitment. Detail level varies — some of these are close to ready to plan, others are just named so they aren't lost.

- **Edit mode, actually editable** — still not built. The original framing here (a read-only copy of View, from the old flow-version-mode-nav paradigm) is stale — that whole page/mode-nav mechanism was deleted and absorbed into the current dockview-based UI (PRs 42–48, `arcs/prune-old-pages.md`/`arcs/workbench-naming.md`). Real editing now points toward the versioning/visual-flow-authoring direction instead, not a "View but editable" mode. Real scope still unknown; not designed yet.
- **A full-step "resolved preview" view** — a view showing _every_ field of a step (matching `StepHttpJsonDetails`' full field list), with each field showing its bound param value before a run and its actual resolved value after. Two distinct gaps motivate this: fields with zero refs are invisible in Run mode entirely; fields that do have refs are only ever shown at leaf-`bindPath` granularity in Field Resolution, never composed back up into the whole logical field. Needs its own design pass before it's scoped, the same way Step Results got one.
- **A generic "open in its own dockview panel" capability for arbitrary content with no persistent identity** — largely done for events (event payloads open in their own panel, PR 28), but the same capability is still missing for the small resolved-text snippets in Step Results: `FieldResolutionRow`'s before/after field view and `ReferenceRow`'s per-reference resolved value only ever render inline today, with no way to pop one open into its own panel the way an event payload can. Not scoped.
- **A dropdown/picker to select an _existing_ sim from a plain, no-run Flow Graph panel** — separate from picking a run to author _from_. Not scoped yet.
- **References for run params** — the reference-resolution family carved out of PR 27/28 (`FieldResolutionRow`'s "before/after" field view, `ReferenceRow`'s per-reference resolved value, `FlowVersionRunParamRow`'s Show-usages report). Not yet through a real discussion pass — the open question isn't just "where does this open" but "how should raw-vs-resolved step viewing work at all" now that `StepDetailsTab` and the params picker can coexist in the same panel.
- **Sims generalizing beyond one parent run** — today a sim is always exactly one `parentRunId` plus a `reuse` list. The named future direction: a sim built from _zero_ run ids, where individual steps' outputs/exports are mocked directly rather than reused from something that actually ran. A materially different authoring model, not an extension of PR 18's flow.
- **Left-side navigation itself, further out.** Once enough of the above exists, the left nav wants a real revisit — the long-term shape wants multiple trees (this Explorer tree being only one view among several), with navigation happening mostly by changing _which tree_ is shown. Not scoped, genuinely unsure what it means yet beyond that direction.
- **A generic/preview Flow Graph panel, unresolved.** Borrowing VS Code's file-explorer preview-tab behavior: single-clicking a run/sim/version loads its content into _one_ reusable Flow Graph panel (the "preview"); an explicit pin gesture promotes it into its own permanent tab. The "dirty" rule (a value-changing action promotes a preview; inspecting doesn't) already maps cleanly onto existing reducers.
  - Close to the opposite of PR 14/15's pattern (stable permanent ids) rather than an extension of it — needs a new `isDirty` field tracking which panel is "the preview," and `Content.tsx` re-deriving cleanly when its own identity changes underneath an already-mounted instance (the one genuinely unproven mechanic).
  - Suggested build order if/when this happens: the `isDirty` field first, alone; then spike the re-derivation-without-remount question in isolation; the tree-click branching last.
  - A possible shortcut: sim authoring could piggyback on this same generic panel — the concrete case that surfaced this section's relevance for authoring, not just viewing. Simulate on a blank Flow Graph panel currently just says "Open a run to simulate from it"; two candidate mechanisms floated (drag a run onto a blank panel; a "select a run" button that arms a tree-click-selection mode), not decided between.
  - PR 16's EventGraph hit this same tension from its own side and sidestepped it entirely by becoming a focus-following singleton instead — a dodge that doesn't generalize back to this section's bigger problem (a singleton, focus-following _Flow Graph_ panel would be the primary editing/comparison surface, not a secondary drill-in view).
- **"Workspace" — named, savable/loadable dockview layouts.** Create/switch/manage multiple saved layout configurations, building on PR 7's storage layer — a System page action loading a specific Workspace of singleton panels is the concrete example floated. Not to be confused with the Workbench itself (the persistent app frame) or the Dock (the live tab/panel machinery) — a Workspace would be one _definition_ loadable into the Dock, not the live thing itself. Not built, not scheduled; the name is reserved for exactly this, decided during the Workbench/Dock/FlowExplorer naming pass (`arcs/workbench-naming.md`). The generic/preview Flow Graph panel idea above may end up surfacing a real need for it.
- **Evals rework** — confirmed its own separate track, no longer a section here at all. See `docs/milestones/evals/`.
- **Parked, explicitly not now: building this as a VS Code extension instead of a native/Electron app.** Real, verified upside if ever revisited — VS Code's `TreeDataProvider` API natively supports lazy-loaded custom tree views, and `QuickPick` is a genuine free answer to the picker-mode problem. Real remaining cost: any custom visual content (flow graphs, artifact viewers) still has to be built as a Webview. Also a fundamentally developer-first distribution model, in tension with any non-technical-user goal. Interesting long-term direction, not a near-term plan.
- **Floated, explicitly not decided, a genuine parking lot**: card view vs. compact list view for the flow browser (possibly both, toggleable); auto-generated flow-diagram thumbnails via React Flow's server-side `renderToStaticMarkup` (confirmed real — official docs list this as a named use case; `FlowGraph.tsx` already computes explicit node positions itself, which happens to fit this approach's requirements); friendly auto-generated human-readable version names alongside mechanical labels/sequence numbers; color/icon markers for flows or versions; System (start/stop status for the engine/worker/etc.) and Settings/Config (API keys, concurrency/limiter settings, infra choice, theme, auth) both need a home in the eventual nav structure.
