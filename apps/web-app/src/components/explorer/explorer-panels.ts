import type { AddPanelPositionOptions, DockviewApi } from "dockview-react";
import { shallowEqual } from "react-redux";

export const EXPLORER_PANEL_COMPONENT = "explorer-tab";

// Flow and Version rows themselves never open a tab (click always toggles
// expand) -- only their fixed leaf children do.
export type OpenPanelRequest =
  | { kind: "flow-settings"; label: string; flowId: string }
  | { kind: "json-definition"; label: string; versionId: string }
  | {
      kind: "flow-graph";
      label: string;
      versionId: string;
      // fixed at open time, never re-derived from live state -- see
      // PR 19 in docs/UI_WORKSPACE_MILESTONE.md for why this is a real
      // discriminated union rather than optional runId?/simId? fields.
      openedAs:
        | { type: "plain" }
        | { type: "run"; runId: string }
        | { type: "sim"; simId: string };
    }
  // opened by a Flow Graph panel's own toolbar, not the tree -- but a
  // singleton, not per-source-panel: it follows whichever Flow Graph panel
  // currently has dockview focus (see use-tracked-flow-graph-panel.ts), so
  // it has no target-specific identity of its own to carry here.
  // `initialTrackedPanelId` is a one-shot bootstrap hint, not identity --
  // used once on first mount, never read again (see that file for why).
  | { kind: "event-graph"; label: string; initialTrackedPanelId?: string }
  | { kind: "artifact"; label: string; hash: string };

function contentId(req: OpenPanelRequest): string {
  switch (req.kind) {
    case "flow-settings":
      return req.flowId;
    case "json-definition":
      return req.versionId;
    case "flow-graph": {
      const { openedAs } = req;
      if (openedAs.type === "sim")
        return `${req.versionId}-sim-${openedAs.simId}`;
      if (openedAs.type === "run") return `${req.versionId}-${openedAs.runId}`;
      return req.versionId;
    }
    // "singleton" here, not something more decorated -- explorerPanelId()
    // already prefixes every id with the kind, so this alone resolves to
    // "event-graph-singleton", unambiguous even if some other panel kind
    // later also wants a singleton and reuses this same literal.
    case "event-graph":
      return "singleton";
    case "artifact":
      return req.hash;
  }
}
// distinct per kind+content, unlike the old slice's kind-only id -- lets two
// different versions' flow-graphs coexist as separate panels, while a plain
// click on the same content still resolves to the same id and gets deduped.
export function explorerPanelId(req: OpenPanelRequest): string {
  return `${req.kind}-${contentId(req)}`;
}

export const EVENT_GRAPH_SINGLETON_ID = explorerPanelId({
  kind: "event-graph",
  label: "",
});

export function openOrFocusPanel(
  api: DockviewApi,
  req: OpenPanelRequest,
  // only consulted when creating a brand-new panel -- an already-open one
  // just gets refocused wherever it already lives.
  options?: { position?: AddPanelPositionOptions },
): void {
  const id = explorerPanelId(req);
  const existing = api.getPanel(id);
  if (existing) {
    // updateParameters/setTitle have no internal diffing -- dockview-react's
    // bridge unconditionally re-renders on every call (deliberately, to
    // defeat React's setState bailout). Guarding here avoids a pointless
    // re-render when refocusing already-open, unchanged content.
    if (!shallowEqual(existing.params, req)) {
      existing.api.updateParameters(req);
    }
    if (existing.title !== req.label) {
      existing.api.setTitle(req.label);
    }
    existing.api.setActive();
    return;
  }
  api.addPanel<OpenPanelRequest>({
    id,
    component: EXPLORER_PANEL_COMPONENT,
    title: req.label,
    params: req,
    ...(options?.position
      ? { position: options.position, floating: false }
      : {}),
  });
}
