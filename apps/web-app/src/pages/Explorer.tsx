import { useState } from "react";
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

export function Explorer() {
  const [dockviewApi, setDockviewApi] = useState<DockviewApi | null>(null);

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
          <ResizablePanel defaultSize="75%">
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
