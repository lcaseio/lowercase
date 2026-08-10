import {
  DockviewDefaultTab,
  type IDockviewPanelHeaderProps,
} from "dockview-react";
import { cn } from "@/lib/utils";
import { getExplorerTabIcon } from "./explorer-tab-icons";
import type { OpenPanelRequest } from "./explorer-panels";

// registered as dockview's "explorer-tab" tabComponent (see
// explorer-panels.ts) -- wraps dockview's own default tab (title text,
// close button, drag handling) rather than reimplementing it, since it
// doesn't expose a slot for injecting an icon of our own.
export function ExplorerTab(
  props: IDockviewPanelHeaderProps<OpenPanelRequest>,
) {
  const icon = getExplorerTabIcon(props.params);
  return (
    <div className="flex items-center gap-1 min-w-0 h-full pl-2">
      {icon && (
        <icon.Icon className={cn("size-3.5 shrink-0", icon.className)} />
      )}
      <DockviewDefaultTab {...props} />
    </div>
  );
}
