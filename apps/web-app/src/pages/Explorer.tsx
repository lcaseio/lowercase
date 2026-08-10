import { useCallback, useEffect, useRef, useState } from "react";
import { DockviewReact, themeAbyss, type DockviewApi } from "dockview-react";
import "dockview-react/dist/styles/dockview.css";
// must load after the import above -- overrides the same `.dockview-theme-abyss`
// selector dockview's own stylesheet defines, same specificity, later source
// order wins. See that file for why a wrapping element's inline style doesn't.
import "./explorer-dockview-theme.css";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ExplorerTree } from "@/components/explorer/ExplorerTree";
import { ExplorerTabContent } from "@/components/explorer/ExplorerTabContent";
import { ExplorerTab } from "@/components/explorer/ExplorerTab";
import { ExplorerWatermark } from "@/components/explorer/ExplorerWatermark";
import { DockviewApiContext } from "@/components/explorer/explorer-dockview-context";
import { EXPLORER_PANEL_COMPONENT } from "@/components/explorer/explorer-panels";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { panelRemoved } from "@/redux/slices/panel-lifecycle-actions";
import {
  loadPersistedExplorerState,
  savePersistedExplorerState,
} from "@/redux/explorer-persistence";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

export function Explorer() {
  const [dockviewApi, setDockviewApi] = useState<DockviewApi | null>(null);
  const dispatch = useAppDispatch();
  const flowGraphPanelsState = useAppSelector((s) => s.flowGraphPanels);
  const eventGraphPanelsState = useAppSelector((s) => s.eventGraphPanels);

  // owned by whichever component holds the live dockviewApi, not specific to
  // this page -- deletes a panel's keyed Redux state on intentional removal
  // only. Dispatches for every panel kind, not just flow-graph's, since
  // deleting a key that was never populated is a harmless no-op.
  useEffect(() => {
    if (!dockviewApi) return;
    const disposable = dockviewApi.onDidRemovePanel((panel) =>
      dispatch(panelRemoved({ panelId: panel.id })),
    );
    return () => disposable.dispose();
  }, [dockviewApi, dispatch]);

  // tracks whether there's an actual pending change since the last write --
  // without this, closing a stale, long-untouched background tab (or just
  // navigating away from an idle /explorer) unconditionally re-persists that
  // tab's old state on the way out, which can stomp a *different*, more
  // recently-active tab's more current write even though nothing here
  // actually changed. Only ever write when something really did.
  const isDirtyRef = useRef(false);
  const writeSnapshotRef = useRef<() => void>(() => {});
  useEffect(() => {
    writeSnapshotRef.current = () => {
      if (!dockviewApi) return;
      savePersistedExplorerState({
        dockview: dockviewApi.toJSON(),
        flowGraphPanels: flowGraphPanelsState,
        eventGraphPanels: eventGraphPanelsState,
      });
      isDirtyRef.current = false;
    };
  }, [dockviewApi, flowGraphPanelsState, eventGraphPanelsState]);

  const debouncedWrite = useDebouncedCallback(
    () => writeSnapshotRef.current(),
    400,
  );
  const scheduleWrite = useCallback(() => {
    isDirtyRef.current = true;
    debouncedWrite();
  }, [debouncedWrite]);

  // restores dockview's own layout, then attaches the layout-change and
  // page-unload flush listeners, all in one synchronous pass -- no separate
  // "hydration complete" flag needed. fromJSON() itself fires
  // onDidLayoutChange, but the listener attached below it in this same
  // callback literally cannot exist yet while fromJSON() is still running,
  // so the ordering that matters falls out of plain execution order.
  useEffect(() => {
    if (!dockviewApi) return;
    const { dockview } = loadPersistedExplorerState();
    if (dockview) {
      dockviewApi.fromJSON(dockview, { reuseExistingPanels: false });
    }

    const layoutDisposable = dockviewApi.onDidLayoutChange(scheduleWrite);
    const flush = () => {
      if (!isDirtyRef.current) return;
      writeSnapshotRef.current();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);

    return () => {
      layoutDisposable.dispose();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [dockviewApi, scheduleWrite]);

  // fires on every change to the flow-graph panels slice itself, independent
  // of dockview's own layout-change events. Declared after the hydration
  // effect above -- React runs effects in declaration order per commit, so
  // this can never fire before that one has on the same render transition,
  // without needing a flag to say so.
  useEffect(() => {
    if (!dockviewApi) return;
    scheduleWrite();
  }, [dockviewApi, flowGraphPanelsState, eventGraphPanelsState, scheduleWrite]);

  return (
    <div className="h-full flex flex-col  dark:bg-neutral-850">
      <div className="flex-1 min-h-0">
        {/* wraps DockviewReact too, not just the tree -- Flow Graph panel
            content (rendered inside DockviewReact via portals, which keep
            React context even though the DOM node is elsewhere) needs
            useDockviewApi() as well now, to open the EventGraph panel. */}
        <DockviewApiContext.Provider value={dockviewApi}>
          <ResizablePanelGroup
            orientation="horizontal"
            className="h-full border dark:border-neutral-800"
          >
            <ResizablePanel defaultSize="15%">
              <ExplorerTree />
            </ResizablePanel>
            <ResizableHandle withHandle />
            {/* react-resizable-panels' own Panel defaults its inner content
                wrapper to `overflow: auto` (see react-resizable-panels.js) --
                fine for typical scrollable content, but DockviewReact manages
                its own internal sizing/scrolling entirely itself. Left at the
                default, shrinking this panel below dockview's natural size
                toggles a native scrollbar for the *whole* dockview area (not
                any one panel), which can change the available width enough to
                toggle it back off -- an oscillation that shows up as flicker
                during a continuous window resize. */}
            <ResizablePanel defaultSize="85%" style={{ overflow: "hidden" }}>
              <DockviewReact
                className="h-full"
                theme={themeAbyss}
                components={{ [EXPLORER_PANEL_COMPONENT]: ExplorerTabContent }}
                defaultTabComponent={ExplorerTab}
                watermarkComponent={ExplorerWatermark}
                onReady={(event) => setDockviewApi(event.api)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </DockviewApiContext.Provider>
      </div>
    </div>
  );
}
