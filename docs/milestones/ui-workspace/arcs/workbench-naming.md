# UI Workspace Milestone — Arc: Naming the shell — Workbench, Dock, FlowExplorer (PRs 47–48)

Part of the [`MILESTONE.md`](../MILESTONE.md) PR log, split out to keep that doc scannable. Surfaced while scoping [`prune-old-pages.md`](./prune-old-pages.md)'s PR 46 (rehoming the flow-version cluster's shared survivors) — answering "where do these files actually belong" led directly into "what do we even call the thing that isn't the tree," which turned out to be a real, standing question rather than a small aside. Distinct narrative from that arc (which is about deleting dead code), so it gets its own file — even though the two PRs land some of the same destination folders and are executed close together, not as a strict two-phase sequence.

**The problem.** "Explorer" has meant two different things bundled into one name and one folder since PR 1 ("Explorer Mini Spike") — a name a first spike needed to have _a_ folder, never a deliberate one for what it grew into. `pages/Explorer.tsx` owns both the tree (`ExplorerTree.tsx` and its rows/lists) _and_ the entire `DockviewReact` host, mounted as one React Router page — so navigating to any other top-level route (`/evals`, `/system`) unmounts both together. That's backwards from the actual intent, which has been Postman-inspired from early on: the persistent app frame (nav + dockview) shouldn't unmount on left-nav clicks; only the tree's own _content_ should be able to change (e.g., a future Evals root swapping in alongside the Flows root) without tearing anything down.

**This arc only settles naming.** Building the actual "doesn't unmount" behavior is explicitly out of scope and stays under `Not yet scoped`'s "Left-side navigation itself, further out" — this arc just makes sure the names chosen now don't fight that direction later, per the user's own framing: "this PR does not seek to build that navigation structure... we don't have to create that future change of the tree right now because we don't have anything to change the tree with."

**Why two PRs, not one.** Originally scoped as a single PR 47 — split once it became clear it bundled a low-risk mechanical piece (renaming things, moving self-contained panel folders) with one genuinely complex, interdependent piece (`flow-graph-panel`'s internal split, which touches three panels' imports at once). Same reasoning as the PR 44/45 merge and the PR 45/46 split earlier in this arc: split when a PR contains a real, isolable decision or risk; merge when it doesn't.

## PR 47 - Rename Explorer -> Workbench/Dock/FlowExplorer (foundational renames + self-contained panels) - not started

### Discussion

**The naming, settled:**

- **Workbench** — the persistent app frame. Already exists in spirit as `AppShell.tsx` (nav rail + `<Outlet />`); the plan is to grow what `AppShell` means rather than invent a new top-level component. `pages/Explorer.tsx` → `pages/Workbench.tsx`, decided — it already substantively _is_ one today (renders the tree and the dockview host together, wires up the dockview API context, routes panel content), only missing the future behavioral pieces tracked separately. Chosen over "Shell" (fine but generically weaker) and initially considered "Workspace" — rejected once its own future meaning became clear, below.
- **Dock** — the dockview/tab-management machinery specifically: tabs, tab-content routing, the empty-state watermark, the dockview React context, panel-routing types, layout persistence, the tabs Redux slice. A _portion_ of the Workbench, not a synonym for it. Chosen over "Workspace" after a real near-miss: the user's first instinct was `WorkspaceTab`/`WorkspaceTabContent`/`WorkspaceWatermark`, which would have collided with "Workspace"'s other, already-decided meaning below — caught and named explicitly before anything was renamed, not after.
- **FlowExplorer** — the tree, narrowed correctly. "Explorer" itself is the _correct_, idiomatic word for this pattern (VS Code's own official term for a browsable hierarchy you click through to open content elsewhere — the direct inspiration already cited) — "Tree" would only describe the widget shape, not its role. "Flows" resolves the only real ambiguity (explorer of _what_ — it's rooted at Flows specifically, not a generic file-explorer for runs/artifacts/anything else).
- **Workspace** — deliberately _not_ used as a code prefix anywhere in this rename. Reserved for a real future feature: a named, saved/predefined dockview layout, loadable into the Workbench — directly revives the "Workspaces" idea marked skipped as PR 8 (`MILESTONE.md`'s "Skipped or superseded" section), which never went away, it just didn't have a slot until this conversation gave it one. Concrete example floated: a System page action that loads a specific Workspace of singleton panels into the Dock. Not built, not scheduled — just a reserved name, protected now specifically so a later feature doesn't have to fight already-shipped code for the word.

**Persistence/state-key risk, resolved as a non-issue.** Single-user local dev app, and the precedent from the last time a persistence-shape change happened was simply clearing the stored state in devtools rather than migrating it. Rename freely — `explorer-tabs-slice.ts` → `dock-tabs-slice.ts`, `explorer-persistence.ts` → `dock-persistence.ts`, whatever state/storage keys change along with them.

**Tree-specific (7 files), folder `components/explorer/` stays as-is (now correctly scoped to just this):**
`ExplorerTree.tsx` → `FlowExplorer.tsx`; `ExplorerFlowRow.tsx`, `ExplorerVersionList.tsx`, `ExplorerVersionRow.tsx`, `ExplorerVersionRunList.tsx`, `ExplorerVersionSimList.tsx`, `ExplorerVersionArtifactList.tsx` → `FlowExplorer`-prefixed equivalents. `CreateFlowDialog.tsx` stays here too — its only caller is `ExplorerTree.tsx`. These are not tree-adjacent-but-actually-something-else the way `ExplorerTab`/`ExplorerTabContent`/`ExplorerWatermark` are (below) — every one of these 8 is genuinely tree content.

**Singular, not plural — `FlowExplorer`, not `FlowsExplorer`.** Matches the established convention of every real "X Explorer" tool: File **Explorer** (Windows), Object **Explorer** (SSMS), Solution/Project **Explorer** (Visual Studio), Package **Explorer** (Eclipse) — the modifier is always singular, functioning attributively (naming the _category_ of thing browsed, not counting instances), the same way "a file explorer" isn't "a files explorer" even though it browses many files.

**Deferred, not decided: whether the tree's own row/list component names (`ExplorerFlowRow`, `ExplorerVersionList`, `ExplorerVersionRow`, `ExplorerVersionRunList`, `ExplorerVersionSimList`, `ExplorerVersionArtifactList`) need more than a mechanical `Explorer`→`FlowExplorer` prefix swap.** Tentatively estimated as its own later PR (49, loosely) — genuinely just an estimate, not a commitment; depends on how the renamed set actually reads once it exists. Not scoped now.

**Dock-specific (8 files) move to a new `components/workbench/dock/` folder**, `Dock`-prefixed where they were `Explorer`-prefixed: `ExplorerTab.tsx`/`ExplorerTabContent.tsx`/`ExplorerWatermark.tsx` → `DockTab.tsx`/`DockTabContent.tsx`/`DockWatermark.tsx`; `explorer-dockview-context.ts` → `dock-context.ts`; `explorer-panels.ts` → `dock-panels.ts`; `explorer-dockview-theme.css` → `dock-theme.css`; `explorer-persistence.ts` → `dock-persistence.ts`; `explorer-tabs-slice.ts` → `dock-tabs-slice.ts`. Despite sounding tree-adjacent by name, these are dockview/tab machinery, not tree content — that's exactly why they get `Dock`-prefixed rather than `FlowExplorer`-prefixed.

**Two outlier panel-content files** lose the stray `Explorer` prefix their sibling panels never had, moving to their own subfolders matching convention: `ExplorerFlowSettingsContent.tsx` → `flow-settings-panel/Content.tsx`; `ExplorerJsonDefinitionContent.tsx` → `json-definition-panel/Content.tsx`.

**Cross-cutting shared utilities → `components/workbench/shared/`** (a real folder, hard invariant: only things with verified, actual multiple consumers go in it, never "this seems generalish"): `CreateArtifactDialog.tsx` (already live in `components/explorer/`, opened from both a tree row and `flow-graph-panel/side-panel/ParamsTab.tsx`), `artifact-title.ts` (same cross-cutting shape). `CodeEditor.tsx`, `MainPanelTypes.ts`, and all of `components/fields/*` land in the same `components/workbench/shared/` folder but are moved as part of PR 46 instead, not this PR — per `prune-old-pages.md`'s mechanical boundary rule, they're loose under `components/` today (not inside `components/explorer/`), so they're PR 46's job even though the destination folder is one PR 47 also populates. Confirmed via grep — `CodeEditor.tsx` alone has 7 importers spanning nearly every panel kind.

**The four self-contained panel folders move wholesale, no internal restructuring** — checked directly (file counts: `artifact-panel/` 5 files/551 lines, `artifact-authoring-panel/` 2 files/394 lines, `event-graph-panel/` 5 files/458 lines, `event-payload-panel/` 1 file/37 lines), confirmed flat with no multi-file tab content anywhere (`MetadataTab.tsx`/`EventDetailsTab.tsx` are each fully self-contained) and no cross-panel sharing pattern (checked by grep — neither authoring/preview panel reaches into its sibling's internals, unlike `flow-graph-panel`'s situation). Nothing here needs the `step-details`/`step-results`-style subfolder treatment: `artifact-panel/`, `artifact-authoring-panel/`, `event-graph-panel/`, `event-payload-panel/` just move to `components/workbench/` as-is.

## PR 48 - `flow-graph-panel` internal split + `shared/flow-graph/` kit + its two authoring panels - not started

### Discussion

The one genuinely complex, interdependent piece — isolated into its own PR specifically because it touches three panels' imports simultaneously (`flow-graph-panel`, `flow-authoring-panel`, `flow-authoring-preview-panel`) and deserves its own focused verification, not to ride along with PR 47's mechanical renames.

**The governing distinction, corrected mid-discussion: not "does this need a real run," it's "is this specific to how one panel composes itself, vs. a generic building block."** `flow-graph-panel` isn't a "run-mode" panel as a special category — it's just capable of running, same as it's capable of anything else its own composition needs. The right question for any given file is just whether other panels actually reach into it.

**`panels/` wrapper folder: rejected.** Considered nesting all panel-kind folders under `components/workbench/panels/` to visually separate them from `dock/` and the shared utilities. Dropped — it doesn't earn its place, since there's no other category of thing at that level to disambiguate from. The `-panel` suffix on each individual folder name already does that job once `panels/` isn't there to do it for them, so the suffix stays.

**`shared/flow-graph/`** — a domain-scoped kit, reused by _three_ panels (`flow-graph-panel`, `flow-authoring-panel`, `flow-authoring-preview-panel`), confirmed by grep: `Rail.tsx`, `SidePanel.tsx`, `GraphViewControls.tsx` (moved here after being found not toolbar-exclusive — `flow-authoring-preview-panel/Content.tsx` imports it directly too), and a `side-panel/` holding the three genuinely shared tabs — `ProblemsTab.tsx`/`ProblemsList.tsx` (content was `FlowProblemsList.tsx`), `ParametersTab.tsx`/`Parameters.tsx` (content was `FlowParameters.tsx`), `StepDetailsTab.tsx`/`step-details/` (content was `components/steps/*`). Checked and confirmed no other panel pair has this pattern (see PR 47) — `flow-graph` is genuinely the only domain-scoped kit today, not a guess dressed up as one.

**`flow-graph-panel/`'s own internals, once its shared pieces moved out:**

- **`toolbar/`** — earned a subfolder the same way `step-details`/`step-results` did: `RunToolbar.tsx` (213 lines) + `SimAuthoringBar.tsx` (41) + `SaveSimDialog.tsx` (119), all three rendered as siblings directly by `Content.tsx`.
- **`side-panel/`, the genuinely exclusive tabs**: `RunInputTab.tsx` (renamed from `ParamsTab.tsx` — not a stylistic call, a correction: the tab's actual UI label, in `Rail.tsx`, has always been "Run Input," not "Params"; the file name was simply stale) + `RunInputRow.tsx` (content, was `FlowVersionRunParamRow.tsx`, following the `FlowListItem`/`RunListItem` row-naming precedent already used elsewhere), `SettingsTab.tsx`, `SimTab.tsx`, `StepResultsTab.tsx` + `step-results/` (content, was `components/flow-version/StepResultsTab.tsx`'s whole subtree — `Content.tsx` replacing the old identically-named file to avoid a same-name collision with its own shell).

**General rule that emerged and generalizes beyond this one panel**: a tab's shell is always `side-panel/<Name>Tab.tsx`. Simple content (one component, nothing nested) stays a plain sibling file named after the tab minus "Tab" (`Parameters.tsx`, `ProblemsList.tsx`, `RunInputRow.tsx`). Content complex enough to have its own multi-file subtree earns a subfolder, same naming rule, with `Content.tsx` as its entry file (matching the `Content.tsx` convention already used at the panel level) — `step-details/`, `step-results/`. Subfolders are earned by real size, not applied as a default.

`flow-authoring-panel/` and `flow-authoring-preview-panel/` move here too (not in PR 47) precisely because they depend on `shared/flow-graph/` existing — both reach directly into it for `Rail`/`SidePanel`/`ProblemsTab`/`ParametersTab`(/`StepDetailsTab` for the preview panel), so they can't safely move independent of this PR's own work.

**Long-term uncertainty flagged, not acted on**: the user floated that `flow-authoring-panel` might eventually get absorbed entirely into `flow-graph-panel` (authoring becoming a mode of the main panel rather than a separate panel kind) — not decided, might not happen, but it's part of why this structure doesn't over-invest further in solidifying the authoring/graph boundary beyond what's already earned by real, current sharing.

## Full settled tree (both PRs)

```
components/workbench/
  dock/                              (PR 47)
    DockTab.tsx
    DockTabContent.tsx
    DockWatermark.tsx
    dock-context.ts
    dock-panels.ts
    dock-theme.css
    dock-persistence.ts
    dock-tabs-slice.ts

  shared/
    flow-graph/                      (PR 48)
      Rail.tsx
      SidePanel.tsx
      GraphViewControls.tsx
      side-panel/
        ProblemsTab.tsx
        ProblemsList.tsx
        ParametersTab.tsx
        Parameters.tsx
        StepDetailsTab.tsx
        step-details/
          Content.tsx
          StepBranchDetails.tsx
          StepHttpJsonDetails.tsx
          StepJoinDetails.tsx
          StepMcpDetails.tsx
          StepParallelDetails.tsx
    fields/                          (PR 46)
      InputField.tsx
      SwitchField.tsx
      SelectField.tsx
      CuratedParamsField.tsx
      IdentityField.tsx
      HeadersField.tsx
      CodeEditorField.tsx
      InputListField.tsx
      ExportsField.tsx
      EvalContextField.tsx
      EvalContextSourceFields.tsx
    CodeEditor.tsx                   (PR 46)
    MainPanelTypes.ts                (PR 46)
    CreateArtifactDialog.tsx         (PR 47)
    artifact-title.ts                (PR 47)

  flow-graph-panel/                  (PR 48, except side-panel content noted below)
    Content.tsx
    use-flow-graph-panel.ts
    toolbar/
      RunToolbar.tsx
      SimAuthoringBar.tsx
      SaveSimDialog.tsx
    side-panel/
      RunInputTab.tsx
      RunInputRow.tsx           (PR 46 — lands early; exclusive content, not shared, so it doesn't belong in shared/flow-graph/. Folder created ahead of the panel's own shell move.)
      SettingsTab.tsx
      SimTab.tsx
      StepResultsTab.tsx
      step-results/                (PR 46 — same early-landing reasoning as RunInputRow.tsx above)
        Content.tsx
        StepOutputExportsPanel.tsx
        StepFieldResolutionPanel.tsx
        StepReferencesPanel.tsx
        FieldResolutionRow.tsx
        ReferenceRow.tsx
        ArtifactHashLoader.tsx

  flow-authoring-panel/              (PR 48)
  flow-authoring-preview-panel/      (PR 48)
  artifact-panel/                    (PR 47)
  artifact-authoring-panel/          (PR 47)
  event-graph-panel/                 (PR 47)
  event-payload-panel/               (PR 47)
  flow-settings-panel/               (PR 47)
    Content.tsx           (was ExplorerFlowSettingsContent.tsx)
  json-definition-panel/             (PR 47)
    Content.tsx           (was ExplorerJsonDefinitionContent.tsx)

components/explorer/                (PR 47 — narrowed, tree-only)
  FlowExplorer.tsx                 (was ExplorerTree.tsx)
  FlowExplorerFlowRow.tsx
  FlowExplorerVersionList.tsx
  FlowExplorerVersionRow.tsx
  FlowExplorerVersionRunList.tsx
  FlowExplorerVersionSimList.tsx
  FlowExplorerVersionArtifactList.tsx
  CreateFlowDialog.tsx

pages/Workbench.tsx                 (PR 47 — was pages/Explorer.tsx)
```

## Sequencing

**With PR 46**: some of PR 46's rescued survivors land inside folders PR 47/48 create (`components/workbench/shared/`, `components/workbench/shared/flow-graph/side-panel/`, etc.) before those PRs' own shell-file moves happen — see `prune-old-pages.md`'s PR 46 entry for the acknowledged interim state that creates. Not a strict phase boundary; all three PRs were always going to land close together.

**PR 47 before PR 48**: PR 48 depends on PR 47 having already created `components/workbench/` and `components/workbench/shared/` (the fully-generic pieces) — PR 48 only adds `shared/flow-graph/` on top of ground PR 47 already broke.

Neither started — naming settled, full tree settled for both PRs, nothing executed yet.
