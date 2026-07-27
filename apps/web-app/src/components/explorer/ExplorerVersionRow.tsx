import type { FlowVersionRecord } from "@lcase/types";
import {
  ChevronDownIcon,
  CurlyBracesIcon,
  NetworkIcon,
  SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function ExplorerVersionRow({
  version,
  isExpanded,
  onToggleExpanded,
  selectedRowId,
  onSelectVersion,
  onSelectVersionSettings,
  onSelectFlowGraph,
  onSelectJsonDefinition,
}: {
  version: FlowVersionRecord;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  selectedRowId: string | null;
  onSelectVersion: () => void;
  onSelectVersionSettings: () => void;
  onSelectFlowGraph: () => void;
  onSelectJsonDefinition: () => void;
}) {
  const isSelected = selectedRowId === `version:${version.id}`;
  const isSettingsSelected = selectedRowId === `version-settings:${version.id}`;
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
              onClick={onSelectVersionSettings}
              className={cn(
                "flex items-center gap-2 pl-16 pr-2 py-1 text-xs italic text-muted-foreground cursor-pointer",
                isSettingsSelected ? "bg-accent" : "hover:bg-accent/40",
              )}
            >
              <SettingsIcon className="size-3.5 shrink-0" />
              <span className="truncate">Settings</span>
            </div>
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
          </>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
