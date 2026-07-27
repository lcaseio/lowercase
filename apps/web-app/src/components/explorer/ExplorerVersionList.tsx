import { useState } from "react";
import type { FlowVersionRecord } from "@lcase/types";
import { useGetFlowVersionsQuery } from "@/redux/api/flows-api";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { ExplorerVersionRow } from "./ExplorerVersionRow";

export function ExplorerVersionList({
  flowId,
  selectedRowId,
  onSelectVersion,
  onSelectVersionSettings,
  onSelectFlowGraph,
  onSelectJsonDefinition,
}: {
  flowId: string;
  selectedRowId: string | null;
  onSelectVersion: (versionId: string) => void;
  onSelectVersionSettings: (version: FlowVersionRecord) => void;
  onSelectFlowGraph: (version: FlowVersionRecord) => void;
  onSelectJsonDefinition: (version: FlowVersionRecord) => void;
}) {
  const { data, error, isLoading } = useGetFlowVersionsQuery(flowId);
  const showLoading = useDelayedLoading(isLoading);
  const [expandedVersionIds, setExpandedVersionIds] = useState<Set<string>>(
    new Set(),
  );

  if (isLoading)
    return showLoading ? (
      <div className="pl-10 py-1 text-sm text-muted-foreground">
        Loading versions...
      </div>
    ) : null;
  if (data?.ok === false)
    return (
      <div className="pl-10 py-1 text-sm text-destructive">
        Error loading versions: {data.error}
      </div>
    );
  if (error || !data)
    return (
      <div className="pl-10 py-1 text-sm text-destructive">
        Error loading versions
      </div>
    );

  const toggleExpanded = (versionId: string) => {
    setExpandedVersionIds((prev) => {
      const next = new Set(prev);
      if (next.has(versionId)) next.delete(versionId);
      else next.add(versionId);
      return next;
    });
  };

  return (
    <>
      {data.value.map((version) => (
        <ExplorerVersionRow
          key={version.id}
          version={version}
          isExpanded={expandedVersionIds.has(version.id)}
          onToggleExpanded={() => toggleExpanded(version.id)}
          selectedRowId={selectedRowId}
          onSelectVersion={() => onSelectVersion(version.id)}
          onSelectVersionSettings={() => onSelectVersionSettings(version)}
          onSelectFlowGraph={() => onSelectFlowGraph(version)}
          onSelectJsonDefinition={() => onSelectJsonDefinition(version)}
        />
      ))}
    </>
  );
}
