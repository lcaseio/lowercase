import { useState } from "react";
import type { FlowVersionRecord, RunListItem, SimListItem } from "@lcase/types";
import {
  ChevronDownIcon,
  CurlyBracesIcon,
  FlaskConicalIcon,
  HistoryIcon,
  NetworkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ExplorerVersionRunList } from "./ExplorerVersionRunList";
import { ExplorerVersionSimList } from "./ExplorerVersionSimList";

export function ExplorerVersionRow({
  version,
  isExpanded,
  onToggleExpanded,
  selectedRowId,
  onSelectVersion,
  onSelectFlowGraph,
  onSelectJsonDefinition,
  onSelectRun,
  onSelectSim,
}: {
  version: FlowVersionRecord;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  selectedRowId: string | null;
  onSelectVersion: () => void;
  onSelectFlowGraph: () => void;
  onSelectJsonDefinition: () => void;
  onSelectRun: (run: RunListItem) => void;
  onSelectSim: (sim: SimListItem["sim"]) => void;
}) {
  const [isRunsExpanded, setIsRunsExpanded] = useState(false);
  const [isSimsExpanded, setIsSimsExpanded] = useState(false);
  const isSelected = selectedRowId === `version:${version.id}`;
  const isGraphSelected = selectedRowId === `flow-graph:${version.id}`;
  const isJsonSelected = selectedRowId === `json-definition:${version.id}`;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <div
        onClick={() => {
          onToggleExpanded();
          onSelectVersion();
        }}
        className={cn(
          "flex items-center gap-2 pl-10 pr-2 py-1 text-xs cursor-pointer",
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
        <span className="truncate">
          {version.versionLabel ?? `Version ${version.sequence}`}
        </span>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {new Date(version.createdAt).toLocaleDateString()}
        </span>
      </div>
      <CollapsibleContent>
        {isExpanded ? (
          <>
            <div
              onClick={onSelectFlowGraph}
              className={cn(
                "flex items-center gap-2 pl-16 pr-2 py-1 text-xs cursor-pointer",
                isGraphSelected ? "bg-accent" : "hover:bg-accent/40",
              )}
            >
              <NetworkIcon className="size-3.5 shrink-0" />
              <span className="truncate">Flow Graph</span>
            </div>
            <div
              onClick={onSelectJsonDefinition}
              className={cn(
                "flex items-center gap-2 pl-16 pr-2 py-1 text-xs cursor-pointer",
                isJsonSelected ? "bg-accent" : "hover:bg-accent/40",
              )}
            >
              <CurlyBracesIcon className="size-3.5 shrink-0" />
              <span className="truncate">JSON Definition</span>
            </div>
            <div
              onClick={() => setIsRunsExpanded((prev) => !prev)}
              className="flex items-center gap-2 pl-16 pr-2 py-1 text-xs cursor-pointer hover:bg-accent/40"
            >
              <ChevronDownIcon
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
                  !isRunsExpanded && "-rotate-90",
                )}
              />
              <HistoryIcon className="size-3.5 shrink-0" />
              <span className="truncate">Runs</span>
            </div>
            {isRunsExpanded ? (
              <ExplorerVersionRunList
                versionId={version.id}
                selectedRowId={selectedRowId}
                onSelectRun={onSelectRun}
              />
            ) : null}
            <div
              onClick={() => setIsSimsExpanded((prev) => !prev)}
              className="flex items-center gap-2 pl-16 pr-2 py-1 text-xs cursor-pointer hover:bg-accent/40"
            >
              <ChevronDownIcon
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
                  !isSimsExpanded && "-rotate-90",
                )}
              />
              <FlaskConicalIcon className="size-3.5 shrink-0" />
              <span className="truncate">Sims</span>
            </div>
            {isSimsExpanded ? (
              <ExplorerVersionSimList
                versionId={version.id}
                selectedRowId={selectedRowId}
                onSelectSim={onSelectSim}
              />
            ) : null}
          </>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
