import { useEffect, useState } from "react";
import type { IDockviewPanel } from "dockview-react";
import { useAppSelector } from "@/redux/typed-hooks";
import { selectFlowGraphPanelState } from "@/redux/slices/flow-graph-panels-slice";
import { useDockviewApi } from "../explorer-dockview-context";
import type { OpenPanelRequest } from "../explorer-panels";

export type TrackedFlowGraphPanel = {
  runId: string | null;
  versionId: string | null;
};

// Follows whichever Flow Graph panel most recently had dockview focus,
// live, and freezes (holds its last {runId, versionId}) once that panel is
// actually gone -- not merely unfocused. Focusing anything else (tree, the
// EventGraph's own panel, another panel kind) leaves tracking untouched:
// nothing in this app changes a panel's tracked run except an action taken
// while focused on it, so there's nothing to revert to. The tracked panel
// actually closing is handled separately below, by dockviewApi.getPanel
// returning nothing -- not by anything here.
export function useTrackedFlowGraphPanel(
  initialTrackedPanelId?: string,
): TrackedFlowGraphPanel {
  const dockviewApi = useDockviewApi();

  // which flow-graph panel (if any) is the most recently focused one --
  // null means "never tracked anything yet," the signal to stop updating
  // the snapshot below and let it freeze. Seeded once from
  // initialTrackedPanelId (see explorer-panels.ts) rather than starting at
  // null; useState's initial argument is only ever consulted on the first
  // render, so a later click's different value never re-seeds an
  // already-mounted singleton.
  const [trackedPanelId, setTrackedPanelId] = useState<string | null>(
    () => initialTrackedPanelId ?? null,
  );

  useEffect(() => {
    if (!dockviewApi) return;
    const sync = (panel: IDockviewPanel | undefined) => {
      const kind = (panel?.params as OpenPanelRequest | undefined)?.kind;
      if (panel && kind === "flow-graph") {
        setTrackedPanelId(panel.id);
      }
      // anything else leaves trackedPanelId untouched -- see the comment
      // above for why.
    };
    sync(dockviewApi.activePanel);
    const disposable = dockviewApi.onDidActivePanelChange((e) => sync(e.panel));
    return () => disposable.dispose();
  }, [dockviewApi]);

  const liveRunId = useAppSelector((s) =>
    trackedPanelId ? selectFlowGraphPanelState(s, trackedPanelId).runId : null,
  );

  // Mirrors {runId, versionId} continuously while trackedPanelId is set --
  // including while it's legitimately blank (focused on a not-yet-run
  // panel) -- and simply stops being updated the moment tracking stops,
  // which is what "freezes" it. Computed during render (React's documented
  // "storing information from previous renders" pattern -- comparing
  // against a value from the last render and conditionally setState-ing),
  // not inside a useEffect: this is pure derivation from other state, and
  // an effect that exists only to copy one piece of state into another is
  // exactly the anti-pattern react-hooks/set-state-in-effect flags.
  const [snapshot, setSnapshot] = useState<TrackedFlowGraphPanel>({
    runId: null,
    versionId: null,
  });
  const [snapshotKey, setSnapshotKey] = useState<string | null>(null);
  const liveKey = trackedPanelId
    ? `${trackedPanelId}:${liveRunId ?? ""}`
    : null;
  if (trackedPanelId && dockviewApi && liveKey !== snapshotKey) {
    const params = dockviewApi.getPanel(trackedPanelId)?.params as
      (OpenPanelRequest & { kind: "flow-graph" }) | undefined;
    if (params) {
      setSnapshot({ runId: liveRunId, versionId: params.versionId });
      setSnapshotKey(liveKey);
    }
  }

  return snapshot;
}
