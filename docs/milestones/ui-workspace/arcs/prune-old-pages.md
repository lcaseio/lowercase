# UI Workspace Milestone — Arc: Prune old pages (PRs 42–46)

Part of the [`MILESTONE.md`](../MILESTONE.md) PR log, split out to keep that doc scannable. The Explorer/dockview arc (PRs 1–41) has fully superseded the older page-navigation UI in every mode it covers; this arc is the cleanup — removing what's dead, and rescuing/rehoming what turned out to still be shared — before file/folder reorganization (a separate, later, not-yet-scoped step) makes sense to start. One continuous investigation across five PRs, sequenced cheapest/safest first: a zero-risk dead-code sweep, three independent old-page clusters that are pure deletions, and one larger cluster that also has to rehome real shared code, not just delete it.

**Methodology note, true of every PR below**: nothing here was assumed from folder names or memory — every file was checked with an actual repo-wide `grep` for its real importers, because folder names turned out to be a genuinely unreliable signal (see PR 46's "mislabeled" findings). This is also why the whole arc got investigated together up front before any PR started: the boundaries between "dead," "old-only," and "actually still shared" only became clear by checking the whole old-page tree at once, not PR by PR.

## PR 42 - Dead-code sweep - merged (#325)

Delete code with zero importers anywhere, not tied to any page — no dependency on anything else in this arc, safe immediately.

### Discussion

Confirmed via repo-wide grep, not folder-name guesswork:

- `components/nodes/parallel.tsx`
- `components/EventBar.tsx`
- `components/FlowTree.tsx`
- `components/fields/EvalContextField.tsx`, `components/fields/EvalContextSourceFields.tsx` — orphaned; not even wired into the eval components that do exist (`components/evals/Eval{ResultTable,ScoreChart,TargetPicker}`)
- `pages/Runner-old.temp.tsx` — fully commented-out, already known before this investigation (untracked/gitignored via `*.temp.*`, deleted directly rather than via `git rm`)

### What actually landed

Four of the five deleted cleanly. **The fifth and sixth (`EvalContextField.tsx`/`EvalContextSourceFields.tsx`) were a real methodology miss, caught by `pnpm typecheck` before landing, not by the original grep pass.** The investigation's grep pattern for "any importer anywhere" had a bug that produced a false negative for both: `ExportsField.tsx` (itself used by the current, live `StepHttpJsonDetails.tsx`) genuinely imports `EvalContextField`, which in turn imports `EvalContextSourceFields` — a real, live dependency chain the original sweep completely missed. Both were restored via `git checkout HEAD --` immediately after `pnpm typecheck` surfaced the break (`Cannot find module './EvalContextField'`), before anything was committed. The other three (`parallel.tsx`, `EventBar.tsx`, `FlowTree.tsx`) were re-verified with a corrected, simpler grep after this was caught, confirmed genuinely zero-importer, and stayed deleted. `pnpm typecheck` and `pnpm lint` both clean after the correction.

Net result: **only 4 of the originally-listed 6 files actually got removed** — `parallel.tsx`, `EventBar.tsx`, `FlowTree.tsx`, `Runner-old.temp.tsx`. `EvalContextField.tsx`/`EvalContextSourceFields.tsx` are not dead code after all; struck from this list, left in place.

## PR 43 - Prune Runner/RunDetails/Runs cluster - ready for review

Removes `pages/Runner.tsx`, `pages/RunDetails.tsx` (route `/runs/details`), and `pages/Runs.tsx`, plus their exclusive components.

### Discussion

**Component-only files confirmed old-page-exclusive, safe to delete with the pages:** all of `components/runner/*` (7 files); most of `components/runs/*` — `RunArtifactList`, `RunArtifactListItem`, `RunArtifactViewer`, `RunDetailsControllerProvider`, `RunDetailsFlowViewer`, `RunDetailsTabs`, `RunList`, `RunListItem`, `use-run-details-controller`, `useRunDetailsData`.

**One real rescue needed first, not just noted in passing: `components/evals/EvaluateExportModal.tsx`** (the LLM-judge trigger modal, already discussed in `docs/todo.md` as real, extension-worthy eval infrastructure) is _only_ reachable today through `components/runs/RunArtifactList.tsx` — one of this cluster's exclusive files. Deleting the cluster naively would delete it too. Decided: it already lives in the right place (`components/evals/`, alongside the other Evals-page components) — no move needed, just don't let it get deleted, and mark it clearly so it doesn't read as accidental dead code to a future sweep. No working trigger/entry point needed in the current UI as part of this — that's future eval-system work, out of scope here.

### What actually landed

The cluster deletion matched the plan exactly — all 3 pages, all 7 `components/runner/*` files, all 10 `components/runs/*` files (including `EvaluateExportModal`'s sole caller, `RunArtifactList.tsx`), plus `redux/slices/runs-slice.ts` and its wiring in `store.ts`. `EvaluateExportModal.tsx` itself was left in place untouched except for a new top-level comment marking it intentionally orphaned, pointing at this arc file and `docs/todo.md`'s updated note (both now describe it as unreachable-but-deliberately-kept, not just imperfect).

**Two things beyond the original scope, both real, both caught by `pnpm typecheck` rather than assumed:**

- **Dangling nav links**: `layout/AppShell.tsx`'s nav array still had `/runner` and `/runs` entries pointing at routes that no longer exist. Not caught by the grep-based component-importer investigation (nav entries are data, not imports) — removed along with their now-unused icon imports (`PlayIcon`, `ListIcon`).
- **A real cross-cluster coupling in `runner-slice.ts`**: it imports the `Tab` type from `components/runs/use-run-details-controller.ts` (one of this cluster's deleted files), purely for its own `activeTab` field. `runner-slice.ts` itself has to survive this PR — `FlowListItem.tsx` (Flows cluster, PR 46) and `SimsListItem.tsx` (Sims cluster, PR 44) both still import `setRunnerFlowSelectedId`/`setRunnerSimSelectedId` from it — so the fix was inlining the small `Tab` union type directly into `runner-slice.ts` rather than reaching back into a file this PR removed.
- **Found but deliberately not acted on, flagged for PR 44/46 instead**: checking `runner-slice.ts`'s full exported surface turned up that most of it (`activeTab`, `selectedEventId`, `eventGraphRunId`'s setter, `flowDef`, `flowHash`'s setter, `hydrateRunnerFromRun`, param-hash handling) has zero remaining consumers anywhere — only `setRunnerFlowSelectedId`, `setRunnerSimSelectedId`, `getEventGraphRunId`, and `selectFlowHash` are still used, all by the Sims/Flows clusters. `runner-slice.ts` isn't part of this PR's own file list, and trimming its dead fields now would touch a shared file mid-way through two other clusters' own pruning — left as-is, worth revisiting once PR 44 and PR 46 land and the slice's true final shape is clear.

`pnpm typecheck` and `pnpm lint` both clean; a repo-wide grep for stray `/runner`/`/runs`/`/runs/details` string references (routes aren't always caught by TS) turned up nothing.

## PR 44 - Prune Sims/CreateSim/ViewSim cluster - not started

Removes `pages/sims/Sims.tsx`, `CreateSim.tsx`, `ViewSim.tsx`, plus their exclusive components.

### Discussion

Pure deletion, nothing to rescue — confirmed via grep that all of `components/sims/*` (7 files) are only ever imported from within this same page cluster.

Not yet built or verified.

## PR 45 - Prune Artifacts.tsx cluster - not started

Removes the top-level `pages/Artifacts.tsx` (global artifact browser), plus its exclusive components.

### Discussion

Pure deletion — `components/artifacts/AddArtifact.tsx`, `ArtifactViewer.tsx`, `ArtifactList.tsx` are only imported from this page.

**One naming note worth flagging, not acting on here**: `components/artifacts/ArtifactList.tsx` and `components/flow-version/artifacts/ArtifactList.tsx` (deleted separately, in PR 46) are two unrelated components sharing an identical name in different folders. Harmless in practice — both die with their respective old pages regardless — but a concrete, found-not-hypothetical example of why the later file/folder rename pass matters, not just moving folders around.

Not yet built or verified.

## PR 46 - Prune Flows/FlowVersion-mode-pages cluster + rehome shared survivors - not started

The largest PR in this arc: removes `pages/Flows.tsx`, `FlowsEdit.tsx`, and all of `pages/flow-version/*` (`FlowVersionWorkspace`, `FlowVersionModeNav`, `FlowVersionModePlaceholder`, `View`, `Edit`, `Run`, `RunHistory`, `Sims`, `Artifacts`, `context.ts`) — but unlike PRs 43–45, this cluster's component tree isn't a pure deletion. Several files inside it are still live, load-bearing dependencies of the current Explorer UI, mislabeled as old only by which folder they happen to sit in.

### Discussion

**Component-only files confirmed old-page-exclusive, safe to delete with the pages:** `FlowSettings.tsx` (+ its only consumer `TextAreaField`, which becomes orphaned the moment `FlowSettings` goes), `FlowList.tsx`/`FlowListItem.tsx`, `FlowVersionList.tsx`/`FlowVersionListItem.tsx`, `FlowEditPanel.tsx`, `AddJsonFlow.tsx` (the bare-textarea upload prototype PR 38 already properly replaces), `UploadFlowFile.tsx`, `AutoFitView.tsx`, and everything under `components/flow-version/` _except_ the survivors below.

**Mislabeled by folder/name — read as "flow-version" or old top-level leftovers, but are actually live and shared with the current Explorer UI. Deleting these would break the current app; this PR needs to rehome them (move, and likely rename), not remove them:**

- `components/flow-version/StepResultsTab.tsx` and its whole rendering subtree, only reachable through it: `StepOutputExportsPanel`, `StepFieldResolutionPanel`, `StepReferencesPanel`, `FieldResolutionRow`, `ReferenceRow`, `ArtifactHashLoader`. Imported directly by `components/explorer/flow-graph-panel/Content.tsx` and its side-panel wrapper.
- `components/flow-version/FlowVersionRunParamRow.tsx` — imported by `components/explorer/flow-graph-panel/side-panel/ParamsTab.tsx`.
- `components/flow-version/artifacts/ArtifactContentPanel.tsx` — imported by `components/explorer/artifact-panel/Content.tsx`. (Its sibling `ArtifactList.tsx` in the same folder is _not_ a survivor — see PR 45's naming-collision note; that one dies with this cluster.)
- `components/CodeEditor.tsx` (top-level, not `components/explorer/`) — used by 4+ current panels including `ExplorerJsonDefinitionContent.tsx`, `flow-authoring-panel/Content.tsx`, `event-payload-panel/Content.tsx`. This is the exact Monaco component from PR 39's spacebar-bug fix.
- `components/EventGraph.tsx` and `components/EventDetails.tsx` (top-level) — the current `event-graph-panel/Content.tsx` and its side-panel `EventDetailsTab.tsx` both wrap these directly rather than having their own reimplementation.
- `components/FlowParameters.tsx`, `components/FlowProblemsList.tsx` — used by both old `FlowVersionDetailsPanel` and current `ParametersTab`/`ProblemsTab`.
- `components/MainPanelTypes.ts` — a shared type file, still imported by current `components/steps/StepDetails.tsx` and others; most of its _usages_ happen to be old code that's being pruned, but the file itself stays.
- All of `components/steps/*` and `components/fields/*` (minus PR 42's two dead `EvalContext*` files) — heavily current, wired throughout the Explorer side-panel tabs (`StepDetailsTab`, `SettingsTab`, `SimTab`, `MetadataTab`, artifact authoring, etc.).

**Left genuinely open, not resolved by the investigation — likely decided during this PR, but could be pushed further out instead:**

- `pages/Dashboard.tsx`'s fate — its content reads as old-page-era, but it's also the `/` root route and the `*` catch-all fallback, so even if the content is pruned, the _routes_ need to point somewhere (most likely `/explorer`) rather than just disappearing.
- Whether `context/` (theme provider, `useTheme`) has any old-vs-new theme logic conflict worth untangling as part of this prune, or whether it's clean and this is a non-issue. Not yet checked closely.

Not yet built or verified.
