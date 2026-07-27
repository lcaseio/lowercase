import type { FlowRecord } from "@lcase/types";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ExplorerVersionList } from "./ExplorerVersionList";

export function ExplorerFlowRow({
  flow,
  isExpanded,
  onToggleExpanded,
  selectedRowId,
  onSelectFlow,
  onSelectVersion,
}: {
  flow: FlowRecord;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  selectedRowId: string | null;
  onSelectFlow: () => void;
  onSelectVersion: (versionId: string) => void;
}) {
  const isSelected = selectedRowId === `flow:${flow.id}`;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <div
        onClick={onSelectFlow}
        className={cn(
          "flex items-center gap-2 px-2 py-1 text-xs cursor-pointer rounded-sm",
          isSelected ? "bg-accent" : "hover:bg-accent/40",
        )}
      >
        <CollapsibleTrigger
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <ChevronDownIcon
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              !isExpanded && "-rotate-90",
            )}
          />
        </CollapsibleTrigger>
        <span className="truncate">{flow.name}</span>
        {flow.kind === "eval" ? (
          <span className="text-xs font-normal rounded px-1.5 py-0.5 bg-cyan-900 text-cyan-100 shrink-0">
            eval
          </span>
        ) : null}
      </div>
      <CollapsibleContent>
        {isExpanded ? (
          <ExplorerVersionList
            flowId={flow.id}
            selectedRowId={selectedRowId}
            onSelectVersion={onSelectVersion}
          />
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
