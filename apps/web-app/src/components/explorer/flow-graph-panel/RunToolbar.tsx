import { Button } from "@/components/ui/button";
import {
  BotIcon,
  ChartNoAxesGanttIcon,
  FileInputIcon,
  PlayIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  hasParams: boolean;
  paramsHasUnsetRequired: boolean;
  showSimulate: boolean;
  runDisabled: boolean;
  onOpenParams: () => void;
  onOpenSim: () => void;
  onOpenEventGraph: () => void;
  onRun: () => void;
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
}: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg  bg-background/50 dark:bg-neutral-800 p-1 shadow-md backdrop-blur">
      {showSimulate && (
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer text-xs text-muted-foreground "
          onClick={onOpenSim}
          title="Simulate"
        >
          <BotIcon className="size-4" />
          Simulate
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="cursor-pointer text-xs text-muted-foreground "
        onClick={onOpenEventGraph}
        title="Open event graph"
      >
        <ChartNoAxesGanttIcon className="size-4" />
        Events
      </Button>
      {hasParams ? (
        <Button
          variant="ghost"
          size="sm"
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
          Run Input
        </Button>
      ) : (
        // reserved empty slot, same footprint as the button above, so Run's
        // position doesn't shift depending on whether this flow has params
        <div
          className="h-8 w-[88px] shrink-0"
          aria-hidden="true"
          data-testid="params-slot-empty"
        />
      )}
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer bg-green-200 dark:bg-green-900"
        onClick={onRun}
        disabled={runDisabled}
      >
        <PlayIcon className="size-4" />
        Run
      </Button>
    </div>
  );
}
