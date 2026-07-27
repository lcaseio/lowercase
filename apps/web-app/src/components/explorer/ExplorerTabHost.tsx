import { XIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  closeTab,
  selectExplorerTabsState,
  setActiveTab,
} from "@/redux/slices/explorer-tabs-slice";
import { ExplorerTabContent } from "./ExplorerTabContent";

export function ExplorerTabHost() {
  const dispatch = useAppDispatch();
  const { tabs, activeTabId } = useAppSelector(selectExplorerTabsState);

  if (tabs.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No tabs open. Select something in the tree to open it here.
      </div>
    );
  }

  return (
    <Tabs
      value={activeTabId ?? undefined}
      onValueChange={(value) => dispatch(setActiveTab(value))}
      className="h-full flex flex-col"
    >
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="group">
            {tab.label}
            <span
              role="button"
              tabIndex={0}
              aria-label={`Close ${tab.label}`}
              onClick={(e) => {
                e.stopPropagation();
                dispatch(closeTab(tab.id));
              }}
              className="ml-1.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20"
            >
              <XIcon className="size-3" />
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="min-h-0 overflow-auto"
        >
          <ExplorerTabContent tab={tab} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
