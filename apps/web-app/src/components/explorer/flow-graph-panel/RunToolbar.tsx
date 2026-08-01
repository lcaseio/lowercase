import { Button } from "@/components/ui/button";
import { FileInputIcon, FlaskConicalIcon, PlayIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  hasParams: boolean;
  paramsHasUnsetRequired: boolean;
  runDisabled: boolean;
  onOpenParams: () => void;
  onOpenSim: () => void;
  onRun: () => void;
};

// bottom-center floating toolbar over the graph canvas (via FlowGraph's
// `toolbar` prop / react-flow's own `Panel`) -- Sim/Params slots stay fixed
// left-to-right regardless of flow content so Run's position never moves.
export function RunToolbar({
  hasParams,
  paramsHasUnsetRequired,
  runDisabled,
  onOpenParams,
  onOpenSim,
  onRun,
}: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg  bg-background/50 dark:bg-neutral-800 p-1 shadow-md backdrop-blur">
      <Button
        variant="ghost"
        size="sm"
        className="cursor-pointer text-xs text-muted-foreground "
        onClick={onOpenSim}
        title="Set sim"
      >
        <FlaskConicalIcon className="size-4" />
        Sim
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
