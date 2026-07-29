import { useEffect, useState } from "react";
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
import { ExplorerWatermark } from "@/components/explorer/ExplorerWatermark";
import { DockviewApiContext } from "@/components/explorer/explorer-dockview-context";
import { EXPLORER_PANEL_COMPONENT } from "@/components/explorer/explorer-panels";
import { useAppDispatch } from "@/redux/typed-hooks";
import { panelRemoved } from "@/redux/slices/flow-graph-panels-slice";

export function Explorer() {
  const [dockviewApi, setDockviewApi] = useState<DockviewApi | null>(null);
  const dispatch = useAppDispatch();

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

  return (
    <div className="h-full flex flex-col  dark:bg-neutral-850">
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full border dark:border-neutral-800"
        >
          <ResizablePanel defaultSize="25%">
            <DockviewApiContext.Provider value={dockviewApi}>
              <ExplorerTree />
            </DockviewApiContext.Provider>
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
          <ResizablePanel defaultSize="75%" style={{ overflow: "hidden" }}>
            <DockviewReact
              className="h-full"
              theme={themeAbyss}
              components={{ [EXPLORER_PANEL_COMPONENT]: ExplorerTabContent }}
              watermarkComponent={ExplorerWatermark}
              onReady={(event) => setDockviewApi(event.api)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
