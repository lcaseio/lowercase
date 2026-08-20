# UI Workspace Milestone — Arc: Prune old pages (PRs 42–46, plus more anticipated)

Part of the [`MILESTONE.md`](../MILESTONE.md) PR log, split out to keep that doc scannable. The Explorer/dockview arc (PRs 1–41) has fully superseded the older page-navigation UI in every mode it covers; this arc is the cleanup — removing what's dead, and rescuing/rehoming what turned out to still be shared. Sequenced cheapest/safest first: a zero-risk dead-code sweep, two independent old-page clusters that are pure deletions, one more pure-deletion cluster, then the real reorg work (rehoming the cluster's few genuinely-shared survivors) as its own separate PR — that last split is where "prune first, reorganize after" (the original plan) turned out not to stay perfectly clean, since a handful of files can't just be deleted along with the rest. (Also renumbered twice along the way, deliberately, not left as skipped gaps: PRs 44/45 merged into one PR once both turned out to be pure deletions, and the original single "45" — delete the cluster and rehome its survivors — split into 45/46 once rehoming turned out to need its own real design pass.)

**Methodology note, true of every PR below**: nothing here was assumed from folder names or memory — every file was checked with an actual repo-wide `grep` for its real importers, because folder names turned out to be a genuinely unreliable signal (see PR 45's "mislabeled" findings). This is also why the whole arc got investigated together up front before any PR started: the boundaries between "dead," "old-only," and "actually still shared" only became clear by checking the whole old-page tree at once, not PR by PR.

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

## PR 43 - Prune Runner/RunDetails/Runs cluster - merged (#326)

Removes `pages/Runner.tsx`, `pages/RunDetails.tsx` (route `/runs/details`), and `pages/Runs.tsx`, plus their exclusive components.

### Discussion

**Component-only files confirmed old-page-exclusive, safe to delete with the pages:** all of `components/runner/*` (7 files); most of `components/runs/*` — `RunArtifactList`, `RunArtifactListItem`, `RunArtifactViewer`, `RunDetailsControllerProvider`, `RunDetailsFlowViewer`, `RunDetailsTabs`, `RunList`, `RunListItem`, `use-run-details-controller`, `useRunDetailsData`.

**One real rescue needed first, not just noted in passing: `components/evals/EvaluateExportModal.tsx`** (the LLM-judge trigger modal, already discussed in `docs/todo.md` as real, extension-worthy eval infrastructure) is _only_ reachable today through `components/runs/RunArtifactList.tsx` — one of this cluster's exclusive files. Deleting the cluster naively would delete it too. Decided: it already lives in the right place (`components/evals/`, alongside the other Evals-page components) — no move needed, just don't let it get deleted, and mark it clearly so it doesn't read as accidental dead code to a future sweep. No working trigger/entry point needed in the current UI as part of this — that's future eval-system work, out of scope here.

### What actually landed

The cluster deletion matched the plan exactly — all 3 pages, all 7 `components/runner/*` files, all 10 `components/runs/*` files (including `EvaluateExportModal`'s sole caller, `RunArtifactList.tsx`), plus `redux/slices/runs-slice.ts` and its wiring in `store.ts`. `EvaluateExportModal.tsx` itself was left in place untouched except for a new top-level comment marking it intentionally orphaned, pointing at this arc file and `docs/todo.md`'s updated note (both now describe it as unreachable-but-deliberately-kept, not just imperfect).

**Two things beyond the original scope, both real, both caught by `pnpm typecheck` rather than assumed:**

- **Dangling nav links**: `layout/AppShell.tsx`'s nav array still had `/runner` and `/runs` entries pointing at routes that no longer exist. Not caught by the grep-based component-importer investigation (nav entries are data, not imports) — removed along with their now-unused icon imports (`PlayIcon`, `ListIcon`).
- **A real cross-cluster coupling in `runner-slice.ts`**: it imports the `Tab` type from `components/runs/use-run-details-controller.ts` (one of this cluster's deleted files), purely for its own `activeTab` field. `runner-slice.ts` itself has to survive this PR — `FlowListItem.tsx` (Flows cluster, PR 45) and `SimsListItem.tsx` (Sims cluster, PR 44) both still import `setRunnerFlowSelectedId`/`setRunnerSimSelectedId` from it — so the fix was inlining the small `Tab` union type directly into `runner-slice.ts` rather than reaching back into a file this PR removed.
- **Found but deliberately not acted on, flagged for PR 44/45 instead**: checking `runner-slice.ts`'s full exported surface turned up that most of it (`activeTab`, `selectedEventId`, `eventGraphRunId`'s setter, `flowDef`, `flowHash`'s setter, `hydrateRunnerFromRun`, param-hash handling) has zero remaining consumers anywhere — only `setRunnerFlowSelectedId`, `setRunnerSimSelectedId`, `getEventGraphRunId`, and `selectFlowHash` are still used, all by the Sims/Flows clusters. `runner-slice.ts` isn't part of this PR's own file list, and trimming its dead fields now would touch a shared file mid-way through two other clusters' own pruning — left as-is, worth revisiting once PR 44 and PR 45 land and the slice's true final shape is clear.

`pnpm typecheck` and `pnpm lint` both clean; a repo-wide grep for stray `/runner`/`/runs`/`/runs/details` string references (routes aren't always caught by TS) turned up nothing.

## PR 44 - Prune Sims/CreateSim/ViewSim + Artifacts.tsx clusters - merged (#327)

Removes `pages/sims/{Sims,CreateSim,ViewSim}.tsx` and the top-level `pages/Artifacts.tsx` (global artifact browser), plus both clusters' exclusive components. Originally scoped as two separate PRs — merged once both turned out to be genuinely "pure deletion, nothing to rescue," per the bundling rule settled on after PR 42/43 (bundle when neither PR has a real decision or rescue step in it).

### Discussion

Pure deletion for both clusters, confirmed via import-path-anchored grep (not bare substrings, after a naming-collision near-miss below): all of `components/sims/*` (7 files) and `components/artifacts/{AddArtifact,ArtifactViewer,ArtifactList}.tsx` are only ever imported from within their own page.

**One near-miss during verification: a naming collision almost produced the same false-cross-cluster-dependency scare PR 43 had.** An initial grep for `sims-slice` also matched `redux/slices/flow-version-sims-slice.ts` — a completely different, unrelated slice for the PR 45 cluster — plus a code comment merely _mentioning_ it by name. A tighter grep confirmed `sims-slice.ts`'s real importers are entirely within this cluster.

**One naming note, not acted on**: `components/artifacts/ArtifactList.tsx` and `components/flow-version/artifacts/ArtifactList.tsx` (deleted separately, in PR 45) are two unrelated components sharing an identical name in different folders. Harmless in practice — both die with their respective old pages regardless — but a concrete example of why the later file/folder rename pass matters, not just moving folders around.

### What actually landed

Matched the plan exactly for both: all 6 pages/components clusters, `redux/slices/sims-slice.ts` and its `store.ts` wiring (no equivalent `artifacts-slice.ts` exists), the `/sims`, `/sims/create`, `/sims/view`, and `/artifacts` routes in `App.tsx`, and their dangling nav entries (+ now-unused `BotIcon`/`FileTextIcon` imports) in `AppShell.tsx` — nav/route cleanup applied proactively this time, based on what PR 43 found. `pnpm typecheck` and `pnpm lint` both clean; stray-string sweeps for `/sims` and `/artifacts` turned up nothing.

## PR 45 - Prune Flows/FlowVersion-mode-pages cluster (deletion only) - ready for review

Removes `pages/Flows.tsx`, `FlowsEdit.tsx`, and all of `pages/flow-version/*` (`FlowVersionWorkspace`, `FlowVersionModeNav`, `FlowVersionModePlaceholder`, `View`, `Edit`, `Run`, `RunHistory`, `Sims`, `Artifacts`, `context.ts`), plus every component confirmed old-page-exclusive. Originally scoped as one PR that also rehomed the cluster's few genuinely-shared survivors — split once it became clear that rehoming is a real design decision (where things actually belong, whether to rename them), not a mechanical deletion, and deserves its own focused pass rather than riding along here. Deliberately not suffixed ("45a"/"45b") — sequential numbering instead, same as the PR 44/45 merge earlier in this arc.

### Discussion

**Component-only files confirmed old-page-exclusive, safe to delete with the pages:** `FlowSettings.tsx` (+ its only consumer `TextAreaField`, which becomes orphaned the moment `FlowSettings` goes), `FlowList.tsx`/`FlowListItem.tsx`, `FlowVersionList.tsx`/`FlowVersionListItem.tsx`, `FlowEditPanel.tsx`, `AddJsonFlow.tsx` (the bare-textarea upload prototype PR 38 already properly replaces), `UploadFlowFile.tsx`, `AutoFitView.tsx`, and everything under `components/flow-version/` _except_ the survivors below, which stay in place, untouched, for now.

**Left in place, deliberately not moved or renamed here — this PR's whole point is staying pure deletion.** Already identified (full list in PR 46 below): `StepResultsTab.tsx`'s subtree, `FlowVersionRunParamRow.tsx`, `ArtifactContentPanel.tsx`, `CodeEditor.tsx`, `EventGraph.tsx`/`EventDetails.tsx`, `FlowParameters.tsx`/`FlowProblemsList.tsx`, `MainPanelTypes.ts`, `components/steps/*`, `components/fields/*`. They keep working exactly where they are — nothing about this PR forces moving them, since `components/flow-version/` sitting mostly-empty except for a dozen still-used files is a fine, safe intermediate state.

**Left genuinely open, not resolved by the investigation:**

- ~~`pages/Dashboard.tsx`'s fate~~ — **resolved during this PR, not deferred after all.** Read directly: the whole component was a 7-line placeholder (`<p>Main</p>`), nothing to preserve. Deleted, with `/` and `*` redirecting to `/explorer` via `<Navigate replace />` — the target this note itself had already anticipated as the obvious choice, so folding it in didn't require a new decision, just confirming the pre-named default and checking there was nothing else in the file.
- Whether `context/` (theme provider, `useTheme`) has any old-vs-new theme logic conflict worth untangling as part of this prune, or whether it's clean and this is a non-issue. Not yet checked closely.

### What actually landed

Matched the plan: all confirmed old-exclusive pages/components deleted, plus the entire `/spike/*` route tree and `SpikeIndexRedirect` (its own top-level route in `App.tsx`, not previously called out by name in the Discussion above but the same "old page-navigation era" cluster — `/spike` was the original pre-Explorer prototype route, superseded the same way everything else here is), `/flows`, `/flows/edit/:flowId`, and their `Spike`/`Flows` nav entries in `AppShell.tsx`. `Dashboard.tsx` was also folded in once its content turned out trivial (see the resolved open question above) — its own nav entry removed too. `context/` was left untouched — still genuinely open, pushed to PR 46 or later.

**One thing beyond the file list above, found the same way PR 43's `runner-slice.ts` coupling was — not by the original grep sweep, but by running the full repo-wide `pnpm typecheck` (not just `apps/web-app`'s own scoped one) after deleting.** All four `flow-version-{run,run-history,sims,artifacts}-slice.ts` files turned out to be exclusively used by the now-deleted mode pages — unlike `runner-slice.ts`/`sims-slice.ts` in PRs 43/44, these had zero real survivors depending on them, so they were deleted too rather than kept. Their three corresponding test files (`flow-version-{artifacts,run-history,sims}-slice.test.ts`) only surfaced on the full repo-wide typecheck, not the scoped `apps/web-app` one used for PRs 42–44 — worth remembering for PR 46: run `pnpm typecheck` from the repo root, not just the package, since test files apparently aren't covered the same way by the scoped command.

All 9 survivor files (`StepResultsTab.tsx`'s subtree, `FlowVersionRunParamRow.tsx`, `ArtifactContentPanel.tsx`) confirmed still present and untouched. `pnpm typecheck` (repo-root) and `pnpm lint` clean; `pnpm vitest run` — all 227 tests across 18 files pass; stray-string sweep for `/spike` and `/flows` turned up nothing.

## PR 46 - Rehome shared survivors out of the old flow-version/top-level component tree - not started

Once PR 45 lands, `components/flow-version/` (and a handful of old top-level loose files) hold only files that are genuinely still live: `StepResultsTab.tsx`'s subtree (`StepOutputExportsPanel`, `StepFieldResolutionPanel`, `StepReferencesPanel`, `FieldResolutionRow`, `ReferenceRow`, `ArtifactHashLoader`), `FlowVersionRunParamRow.tsx`, `ArtifactContentPanel.tsx`, `CodeEditor.tsx`, `EventGraph.tsx`/`EventDetails.tsx`, `FlowParameters.tsx`/`FlowProblemsList.tsx`, `MainPanelTypes.ts`, `components/steps/*`, `components/fields/*` — all confirmed as real, load-bearing imports of the current Explorer UI in PR 45's investigation. This PR decides where they actually belong and moves (likely renames) them there, then deletes whatever's left of `components/flow-version/`.

### Discussion

Genuinely a design decision, not a mechanical sweep — this is the first real piece of the file/folder reorganization work named (but deliberately deferred) back when PR 42 was first scoped, and it's also tangled up with the still-open question of whether `components/explorer/` itself is well-named for what it's grown into (a spike-era name, not a deliberate one — see the reorg note under `Not yet scoped` in `MILESTONE.md`). Likely worth a Plan Mode pass given the number of files and naming decisions involved, rather than the grep-and-delete treatment PRs 42–45 got.

Not yet discussed in detail or started.

**Anticipated but not yet scoped: something after PR 46 to look at what's actually left.** Once the dead pages are gone and the survivors are rehomed, worth one more pass over the whole `apps/web-app/src` tree to check for anything this investigation didn't catch — not committed to as its own numbered PR yet, just expected.
