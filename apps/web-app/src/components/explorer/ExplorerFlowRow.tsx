import type {
  FlowRecord,
  FlowVersionRecord,
  RunListItem,
  SimListItem,
} from "@lcase/types";
import {
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  SettingsIcon,
} from "lucide-react";
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
  onSelectFlowSettings,
  onSelectVersion,
  onSelectFlowGraph,
  onSelectJsonDefinition,
  onSelectRun,
  onSelectSim,
}: {
  flow: FlowRecord;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  selectedRowId: string | null;
  onSelectFlow: () => void;
  onSelectFlowSettings: () => void;
  onSelectVersion: (versionId: string) => void;
  onSelectFlowGraph: (version: FlowVersionRecord) => void;
  onSelectJsonDefinition: (version: FlowVersionRecord) => void;
  onSelectRun: (version: FlowVersionRecord, run: RunListItem) => void;
  onSelectSim: (version: FlowVersionRecord, sim: SimListItem["sim"]) => void;
}) {
  const isSelected = selectedRowId === `flow:${flow.id}`;
  const isSettingsSelected = selectedRowId === `flow-settings:${flow.id}`;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <div
        onClick={() => {
          onToggleExpanded();
          onSelectFlow();
        }}
        className={cn(
          "flex items-center gap-2 px-2 py-0.5 text-xs cursor-pointer",
          isSelected ? "bg-accent" : "hover:bg-accent/40",
        )}
      >
        <div className="flex items-center gap-0.5">
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
          {isExpanded ? (
            <FolderOpenIcon className="size-3.5 shrink-0" />
          ) : (
            <FolderIcon className="size-3.5 shrink-0" />
          )}
        </div>
        <span className="truncate">{flow.name}</span>
        {flow.kind === "eval" ? (
          <span className="text-xs font-normal rounded px-1.5 py-0.5 bg-cyan-900 text-cyan-100 shrink-0">
            eval
          </span>
        ) : null}
      </div>
      <CollapsibleContent>
        {isExpanded ? (
          <>
            <div
              onClick={onSelectFlowSettings}
              className={cn(
                "flex items-center gap-2 pl-10 pr-2 py-0.5 text-xs italic text-muted-foreground cursor-pointer",
                isSettingsSelected ? "bg-accent" : "hover:bg-accent/40",
              )}
            >
              <SettingsIcon className="size-3.5 shrink-0" />
              <span className="truncate">Settings</span>
            </div>
            <ExplorerVersionList
              flowId={flow.id}
              selectedRowId={selectedRowId}
              onSelectVersion={onSelectVersion}
              onSelectFlowGraph={onSelectFlowGraph}
              onSelectJsonDefinition={onSelectJsonDefinition}
              onSelectRun={onSelectRun}
              onSelectSim={onSelectSim}
            />
          </>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
