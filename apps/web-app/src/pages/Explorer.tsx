import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ExplorerTree } from "@/components/explorer/ExplorerTree";
import { ExplorerTabHost } from "@/components/explorer/ExplorerTabHost";

export function Explorer() {
  return (
    <div className="h-full flex flex-col  dark:bg-neutral-850">
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full border dark:border-neutral-800"
        >
          <ResizablePanel defaultSize="25%">
            <ExplorerTree />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="75%">
            <ExplorerTabHost />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
