# Explorer/Dockview State Management — Research Toward a Future ADR

## Purpose

This is pre-ADR research, not a decision record. It captures the reasoning trail from an extended discussion about where Explorer panel state should live, why the question got harder once `dockview-react` and multi-instance panels landed (PR 5), and what's still genuinely unresolved. Once a real implementation validates the approach (see "Sequencing" below), this gets distilled into an actual ADR in `docs/adr/` — the point of writing it now is so that distillation doesn't require re-deriving everything from scratch, and so nothing decided here gets lost before that happens.

Referenced from `UI_WORKSPACE_MILESTONE.md`'s "Global workspace" section, not duplicated there — that doc's PR-by-PR narrative isn't the right shape for a cross-cutting concern like this one.

## The problem

Confirmed empirically after PR 5 shipped: Explorer panel state survives switching between tabs now (the actual point of adopting dockview), but a full browser refresh — or navigating away from `/explorer` and back — still destroys everything. This isn't a new gap PR 5 introduced; it's the same one PR 4 already surfaced (route navigation unmounts everything), just via a more common trigger. Given this whole redesign is explicitly modeled on VS Code/Postman, and both of those _do_ restore open tabs after a restart, the bar here is legitimately an IDE's, not an ordinary web page's — losing every open tab on every refresh is a bigger tax on this UI than it would be on a typical page-based app.

## Key distinction: identity-derivable vs. runtime-acquired state

This is the finding that actually made the rest of the problem tractable, not just harder to see.

- **Identity-derivable state** — what a panel _is_: `flowId`, `versionId`, and (if the panel was opened specifically to view an existing run) a `runId`. This is already solved, for free, by a design choice already in place: each panel's identifying data lives entirely in its own dockview `params`, set once at creation (`openOrFocusPanel` → `api.addPanel({..., params: req})`). Confirmed via the actual installed types: `GroupviewPanelState.params?: {[key: string]: any}` is part of what `DockviewApi.toJSON()`/`fromJSON()` captures — so persisting dockview's own layout snapshot already restores every panel's identity correctly, with zero additional plumbing. `ExplorerTabContent.tsx` renders purely from `props.params` and never reaches back into the tree at runtime, so a restored panel renders exactly as correctly as a freshly-opened one.
- **Runtime-acquired state** — state that comes into existence only _after_ a panel already exists, as a consequence of interacting with it. The clearest case: triggering a _new_ run from a panel that was opened just to view a version (not opened already associated with a run). This can't be identity-derivable by definition — it didn't exist at creation time — so it needs some other persistence path if it's meant to survive a refresh.
- A third, explicitly lower-priority bucket: inner per-panel UI state that isn't identity and isn't "important" business state either — e.g., which right-panel tab (Params vs. Sim) was last selected. Fine to lose; recovering identity already gets you back to a working, re-editable state, and losing just the fine-grained selection is a much smaller cost.

## Options considered for runtime-acquired state

### A. Piggyback on dockview's own `params` via `updateParameters()`

A panel can update its own identity data after the fact — `props.api.updateParameters({...params, runId})` — since each panel component receives its own `DockviewPanelApi` as `props.api`. This works, and requires no new infrastructure for a single field like `runId`.

Real costs, confirmed against the actual library source (`dockview-react`'s `react.js`), not assumed:

- `updateParameters`/`setTitle` have **no internal diffing** — the React bridge unconditionally bumps a render counter on every call, deliberately engineered (per the library author's own comment) to defeat React's setState bailout. Every write is a re-render (not a remount — no state loss, just redundant render work) unless guarded.
- The persistence trigger (whatever eventually auto-saves the dockview snapshot) would need to fire on parameter-change events too, not just structural layout-change events — a new, bespoke wiring requirement per field that uses this trick.
- It conflates two previously-clean concepts: `params` today means "the panel's identity, set once by whoever opened it, read-only from the panel's own perspective." A panel mutating its own params to persist internal state inverts that, and nothing structurally marks which fields are identity vs. mutable business state once you start doing this.

**Conclusion: fine as a one-off for `runId` specifically** (small, contained, already fits an existing pattern), given the discipline of treating `params.runId` as a one-time seed for initial local state and never reading it back after mount (a one-way write-forward, not a two-way sync). **Not a general pattern** — repeating this trick for every new piece of state that wants persistence would mean re-deriving the same discipline and the same bespoke event-wiring each time, with nothing enforcing it structurally.

### B. Components self-serialize to storage, independent of Redux

Each panel keeps owning its state exactly as today, but a small reusable hook (`usePersistedState`, a drop-in `useState` replacement that also syncs to storage keyed by the panel's own stable id) adds a persistence side-channel without changing how any component is written internally.

Pros: least structural change; no forced re-renders (writing to storage is a side effect, not a React update); no keying problem to invent, since panel ids already exist.

Real cost: no automatic cleanup. Dockview's own `params` disappear when a panel closes, for free — a component's own storage key does not, unless something explicitly reconciles stored keys against the currently-open panel-id list and prunes orphans. A coordinated version of this (one shared registry, one bundled write pass alongside dockview's own layout write) fixes that, but reintroduces a small amount of centralization — not full Redux, but a shared collector, undermining some of the "fully decentralized" appeal.

### C. Redux with a keyed slice, serialized alongside dockview's layout (the direction settled on)

Move relevant local state into a Redux slice, `Record<panelId, PanelState>` (keyed by panel id, **not** a flat singleton — critical, since multi-instance panels are now real and a singleton-per-"current thing" slice, like the old `flowVersionRunSlice`, would break the moment two flow-graph panels are open at once). Persist via a subscriber/middleware that serializes the relevant slice(s) to storage on change, uniformly, regardless of which field changed.

Why this won over A and B: any state change goes through one dispatch pipe, so "persist on change" is one subscription that doesn't need to know about each new field individually — the scaling property neither A nor B has. A and B both require bespoke per-field wiring (A: hook into parameter-change events per field; B: register with the shared collector per component) as more state accumulates; C doesn't.

**Cleanup**: originally this looked like a simple component `useEffect` cleanup keyed by panel id, but PR 6 scoping corrected that: cleanup should be tied to Dockview's intentional panel-removal event, not generic React unmount. Closing/removing a panel should delete that panel's keyed state; route/host unmount should preserve it as part of the current in-memory workspace/session; workspace switching should reset the whole live explorer slice and hydrate the target workspace. This cleanup is **session housekeeping** (stop closed tabs' state from accumulating as orphaned entries while the app keeps running), entirely separate from the refresh-survival story, which is what the serialization/rehydration side handles. Keep these two mentally distinct; conflating them is an easy mistake.

## Refinements settled while scoping PR 6

A few things sharpened once PR 6 actually got scoped, past what the options analysis above committed to:

**One slice per panel kind, not one combined slice.** Judged on this problem's own merits, not against `flowVersionRunSlice`'s singleton shape: "if the state is common to all panels, put it in a common explorer panel slice; if it only makes sense for one panel kind, put it in that panel kind's slice, keyed by `panelId`." Today only flow-graph panels have any local state worth migrating, so that's the only slice PR 6 builds — `flow-graph-panels-slice.ts`, `Record<panelId, {selectedParamHashes, rightPanelTab, runId}>`. No shared "common explorer panel" slice exists yet, because there's no real cross-kind state need yet, and building one ahead of a second consumer would be pure speculation. (A persistence-pipeline status object — `hydrated`/`dirty`/`saving`/`lastSavedAt`/`saveError` — came up as a candidate for "common state" and was correctly ruled back out: it's global/singleton, not keyed by `panelId`, and describes the persistence system itself rather than any panel's behavior. If/when PR 7 needs it, it's its own slice, not part of this taxonomy.)

**Shared lifecycle actions don't require a shared slice.** The one genuinely cross-cutting thing right now is the removal _event_, not state: `panelRemoved` (named to match dockview's own `onDidRemovePanel`, not a different verb like "closed") is defined on `flow-graph-panels-slice` for now — the only real consumer — and dispatched from one central listener. If a second panel-kind slice ever needs the same cleanup, it adds its own `extraReducers` case for the same action; no shared-action module needs to exist before there's a second consumer.

**Panel id comes from `props.api.id`, not a recomputed `explorerPanelId()` call.** Every dockview panel component receives `props.api: DockviewPanelApi`, which exposes the real id dockview assigned at `addPanel({id, ...})` time (confirmed via `dockview-core`'s `PanelApi` type: `readonly id: string`). That's the single source of truth to key Redux by — threaded down as a `panelId` prop rather than re-derived a second time inside the component, which could drift from `explorer-panels.ts`'s formula if that ever changes.

**Cleanup wiring is described as owned by whichever component holds the live `dockviewApi`, not as "`Explorer.tsx`'s responsibility."** `Explorer.tsx` is a temporary/spike home for this UI, not necessarily its final one — the long-term direction trends toward much less page navigation at all, with the left-tree acting more as a content switcher within a persistent space than a route change. Naming the wiring after the current page would make it harder to carry forward when the host moves. Checked `dockviewComponent.js`'s actual `dispose()` path while researching this: there's no override in that file, so a full teardown (React unmounting `<DockviewReact>`) likely inherits a generic disposable-store teardown distinct from the `removePanel()` path that fires `onDidRemovePanel` — consistent with wanting explicit closes to clean up state while incidental unmounts don't. **Confirmed empirically during the PR 6 build**: `onDidRemovePanel` does not fire during full `<DockviewReact>` teardown — navigating away from `/explorer` and back leaves a panel's keyed Redux state untouched (reopening the same content resumes it exactly), while explicitly closing a panel's tab does correctly delete that panel's entry. No teardown guard needed. This is the one time in this arc reading the source turned out to match reality exactly — worth noting since the pattern until now had been the opposite (theme mechanism, `updateParameters` diffing, default placement all needed correction after direct testing).

**Corrected: PR 6 alone does have a real, demoable payoff — the "no new user-visible behavior" framing above undersold it.** Redux's store is a singleton living above the router, so it survives route/host unmount of the dockview host. Only the ephemeral `DockviewComponent`'s own layout is destroyed on that unmount, not Redux. Panel ids are already content-derived and deterministic (`${kind}-${contentId}`, true since PR 5 — originally added so a second click on the same tree row doesn't create a duplicate panel, not for this reason, but it's exactly the property this needs), so reopening the same content after host unmount resolves to the same id and finds its old Redux entry waiting. `selectedParamHashes`/`runId`/`rightPanelTab` resume automatically — a real capability from PR 6 alone, not just prep work for PR 7. This does **not** apply to intentional panel removal: if the user closes/removes the panel and `panelRemoved` runs, that keyed entry is deleted by design.

**Explicit two-axis split on "navigate away and lose everything," and where the line is drawn.** Surviving in-app navigation (no reload) needs no `localStorage` at all — the JS process never dies, so anything held above the router (Redux, or even a plain in-memory value) already survives it, which is exactly the mechanism the previous point relies on. Surviving an actual reload needs real durable storage, which is PR 7's job. The one thing that doesn't come back on its own, even for the no-reload case: dockview's own tab _arrangement_ — nothing captures a `toJSON()` snapshot anywhere yet, so the host comes back empty until each tree row is manually re-clicked (which then resumes correctly, per the point above). An in-memory-only snapshot-and-restore of that layout (no `localStorage`, just held above the router) would technically also survive navigate-away-and-back — but that path was deliberately not taken for PR 6. Dockview keeps owning 100% of layout/tabs; PR 7 is where any of it gets persisted, for either survival tier.

## Workspace-switching implications

"Workspaces" (multiple named, savable/loadable dockview layouts — a named future feature, not built, no UI yet) add a dimension none of the above assumed. Resolved, at least in reasoning:

- **The keyed Redux slice should not know about workspaces at all.** It represents exactly one thing — whatever's currently loaded — full stop. Workspace identity belongs entirely in the _storage_ layer (key by workspace id there), not in the live slice's shape. Don't add a `workspaceId` field to every entry; swap which storage key is being read from/written to instead.
- **Switching workspaces needs an explicit reset of the live slice before loading the target's saved state**, not a merge. Otherwise stale entries from the workspace being left bleed into the one being entered — the same orphaned-state risk as panel-unmount cleanup, recurring at a coarser granularity.
- **If the persistence layer is continuous** (subscribes to changes, writes them out as they happen, which is the natural shape for "don't lose work on refresh" anyway), then "save the workspace you're leaving" isn't a separate step to remember at switch-time — it's already been happening the whole time you were in it. Switching reduces to: stop writing to A's key, reset the live slice, load B's key, populate. No special save-then-load choreography needed beyond that.
- **Worth designing the storage-key scheme with a workspace id from day one**, even though only one (implicit) workspace exists today — the same "design the seam before the feature needs it" move already made for multi-instance panel ids before multi-instance was actually used anywhere.

None of this needs building now. It's context for shaping the persistence layer correctly when it _is_ built, not a reason to build workspaces themselves yet.

## Sequencing — why no ADR yet

Every single time something in this arc was actually built or tested small before being committed to, it revealed something pure discussion hadn't anticipated: the dockview render-mode persistence claim, the theme-override mechanism (a wrapping element's inline style silently doing nothing, root-caused only by reading the actual library source), `updateParameters`'s no-diffing behavior, the undocumented default panel placement. No exception so far. There's no reason to expect the keyed-slice-plus-persistence-plus-cleanup pattern to be different.

**Decision: build it for real, scoped to the Flow Graph panel only** (the most developed case, with the clearest existing local state to migrate — `selectedParamHashes`, `runId`, `rightPanelTab`) — as the actual implementation, not a throwaway spike — before writing the ADR or generalizing the pattern to other panel types. The ADR gets written once this is live and the shape has actually been felt in practice, so it documents a verified decision rather than a bet.

## Open questions, explicitly not yet resolved

- Shape of the keyed slice is resolved (one slice per panel kind, see "Refinements settled while scoping PR 6" above); what triggers a _persisted_ write (every action? debounced? tied to dockview's own layout-change events?) is still open, and is now purely PR 7's question since PR 6 has no persistence step at all.
- Whether the storage-key workspace-namespacing gets built into the persistence layer now (even with no workspace feature yet) or added when workspaces themselves are.
- Whether per-panel inner UI state (e.g., right-panel tab selection) ever becomes its own dockview panel instead of component-local state — floated, explicitly not decided ("I don't know that I want to do that").
- Whether `localStorage` is the final persistence target or an intermediate step before a database-backed version (relevant once/if cross-device or shareable workspaces become a real goal — not stated as one yet).
