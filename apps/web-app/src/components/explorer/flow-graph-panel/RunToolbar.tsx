import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import {
  FileInputIcon,
  PlayIcon,
  NetworkIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LayoutDirection } from "@/redux/slices/flow-graph-panels-slice";
import { FIT_VIEW_OPTIONS } from "@/lib/flow-graph-layout";

import {
  EVENT_GRAPH_ICON,
  EVENT_GRAPH_ICON_CLASS,
  SIM_ICON,
  SIM_ICON_CLASS,
} from "../explorer-tab-icons";

type Props = {
  hasParams: boolean;
  paramsHasUnsetRequired: boolean;
  showSimulate: boolean;
  runDisabled: boolean;
  onOpenParams: () => void;
  onOpenSim: () => void;
  onOpenEventGraph: () => void;
  onRun: () => void;
  isRerun?: boolean;
  layoutDirection: LayoutDirection;
  onSetLayoutDirection: (direction: LayoutDirection) => void;
};

// bottom-center floating toolbar over the graph canvas (via FlowGraph's
// `toolbar` prop / react-flow's own `Panel`) -- Params keeps a reserved slot
// so Run's position never moves regardless of flow content; Simulate is
// removed outright (no reserved slot) instead, when hidden -- unlike
// Params, whose absence is just "this flow has none", Simulate being
// hidden means "viewing a sim directly, nothing to do here but look, which
// the rail's own Simulate tab already covers" -- a different enough case
// not to reuse the same placeholder treatment.
export function RunToolbar({
  hasParams,
  paramsHasUnsetRequired,
  showSimulate,
  runDisabled,
  onOpenParams,
  onOpenSim,
  onOpenEventGraph,
  onRun,
  isRerun,
  layoutDirection,
  onSetLayoutDirection,
}: Props) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg  bg-background/50 dark:bg-neutral-800 p-1 shadow-md backdrop-blur">
        <Button
          variant="ghost"
          size="xs"
          className="cursor-pointer text-xs text-muted-foreground"
          onClick={() => zoomIn()}
          title="Zoom in"
        >
          <ZoomInIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className="cursor-pointer text-xs text-muted-foreground"
          onClick={() => zoomOut()}
          title="Zoom out"
        >
          <ZoomOutIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className="cursor-pointer text-xs text-muted-foreground"
          onClick={() => fitView(FIT_VIEW_OPTIONS)}
          title="Fit view"
        >
          <MaximizeIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className={cn(
            "cursor-pointer text-xs",
            layoutDirection === "TB"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground",
          )}
          onClick={() => onSetLayoutDirection("TB")}
          title="Vertical layout"
        >
          <NetworkIcon className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="xs"
          className={cn(
            "cursor-pointer text-xs",
            layoutDirection === "LR"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground",
          )}
          onClick={() => onSetLayoutDirection("LR")}
          title="Horizontal layout"
        >
          <NetworkIcon className="size-4 rotate-270" />
        </Button>
      </div>
      <div className="flex items-center gap-1 rounded-lg  bg-background/50 dark:bg-neutral-800 p-1 shadow-md backdrop-blur">
        {showSimulate && (
          <Button
            variant="ghost"
            size="xs"
            className="cursor-pointer text-xs text-muted-foreground "
            onClick={onOpenSim}
            title="Simulate"
          >
            <SIM_ICON className={cn(SIM_ICON_CLASS, "size-4")} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="xs"
          className="cursor-pointer text-xs text-muted-foreground "
          onClick={onOpenEventGraph}
          title="Open event graph"
        >
          <EVENT_GRAPH_ICON className={cn(EVENT_GRAPH_ICON_CLASS, "size-4")} />
        </Button>
        {hasParams && (
          <Button
            variant="ghost"
            size="xs"
            className={cn(
              "cursor-pointer",
              paramsHasUnsetRequired
                ? " text-xs text-amber-700 dark:text-amber-400 dark:bg-amber-900 hover:dark:bg-amber-800"
                : " text-xs text-muted-foreground",
            )}
            onClick={onOpenParams}
            title="Set params"
          >
            <FileInputIcon className="size-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="xs"
          className="cursor-pointer bg-green-200 dark:bg-green-900 hover:bg-green-100 hover:dark:bg-green-800"

          onClick={onRun}
          disabled={runDisabled}
        >
          <PlayIcon className="size-4" />
          {isRerun ? "Rerun" : "Run"}
        </Button>
      </div>
    </div>
  );
}
