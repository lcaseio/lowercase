import {
  BotIcon,
  ChartNoAxesGanttIcon,
  CurlyBracesIcon,
  FileTextIcon,
  HistoryIcon,
  NetworkIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import type { OpenPanelRequest } from "./explorer-panels";

// Shared by both the tree rows (which import these directly, since each row
// already knows statically which one it is) and getExplorerTabIcon below
// (the only place that needs to derive one dynamically, since one tab
// component is registered for every panel).
export const FLOW_GRAPH_ICON = NetworkIcon;
export const FLOW_GRAPH_ICON_CLASS = "text-blue-400";
export const JSON_DEFINITION_ICON = CurlyBracesIcon;
export const JSON_DEFINITION_ICON_CLASS = "text-yellow-400";
export const RUN_ICON = HistoryIcon;
export const RUN_ICON_CLASS = "text-rose-400";
export const SIM_ICON = BotIcon;
export const SIM_ICON_CLASS = "text-violet-400";
// matches RunToolbar.tsx's own "Events" button icon
export const EVENT_GRAPH_ICON = ChartNoAxesGanttIcon;
export const EVENT_GRAPH_ICON_CLASS = "text-teal-400";
// matches this app's established artifact icon (AppShell.tsx, FlowVersionModeNav.tsx)
export const ARTIFACT_ICON = FileTextIcon;
export const ARTIFACT_ICON_CLASS = "text-orange-400";

export function getExplorerTabIcon(
  params: OpenPanelRequest,
): { Icon: LucideIcon; className?: string } | null {
  switch (params.kind) {
    case "flow-settings":
      return { Icon: SettingsIcon };
    case "json-definition":
      return {
        Icon: JSON_DEFINITION_ICON,
        className: JSON_DEFINITION_ICON_CLASS,
      };
    case "flow-graph": {
      const { openedAs } = params;
      if (openedAs.type === "run")
        return { Icon: RUN_ICON, className: RUN_ICON_CLASS };
      if (openedAs.type === "sim")
        return { Icon: SIM_ICON, className: SIM_ICON_CLASS };
      return { Icon: FLOW_GRAPH_ICON, className: FLOW_GRAPH_ICON_CLASS };
    }
    // no tree-row analog (opened from a Flow Graph panel's own toolbar, not
    // the tree) -- future may add tree context menu to open or key shortcut
    case "event-graph":
      return { Icon: EVENT_GRAPH_ICON, className: EVENT_GRAPH_ICON_CLASS };
    case "artifact":
      return { Icon: ARTIFACT_ICON, className: ARTIFACT_ICON_CLASS };
  }
}
