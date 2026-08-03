import type { DockviewApi } from "dockview-react";
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
      runId?: string;
      simId?: string;
    };

function contentId(req: OpenPanelRequest): string {
  switch (req.kind) {
    case "flow-settings":
      return req.flowId;
    case "json-definition":
      return req.versionId;
    case "flow-graph":
      if (req.simId) return `${req.versionId}-sim-${req.simId}`;
      if (req.runId) return `${req.versionId}-${req.runId}`;
      return req.versionId;
  }
}

// distinct per kind+content, unlike the old slice's kind-only id -- lets two
// different versions' flow-graphs coexist as separate panels, while a plain
// click on the same content still resolves to the same id and gets deduped.
export function explorerPanelId(req: OpenPanelRequest): string {
  return `${req.kind}-${contentId(req)}`;
}

export function openOrFocusPanel(
  api: DockviewApi,
  req: OpenPanelRequest,
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
  });
}
