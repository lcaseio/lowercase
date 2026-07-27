import { useState } from "react";
import { useGetFlowsQuery } from "@/redux/api/flows-api";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { ExplorerFlowRow } from "./ExplorerFlowRow";

export function ExplorerTree() {
  const { data, error, isLoading } = useGetFlowsQuery();
  const showLoading = useDelayedLoading(isLoading);
  const [expandedFlowIds, setExpandedFlowIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  if (isLoading) return showLoading ? <div>Loading flows...</div> : null;
  if (data?.ok === false)
    return <div>Error loading flows: {data.error}</div>;
  if (error || !data) return <div>Error loading flows</div>;

  const toggleExpanded = (flowId: string) => {
    setExpandedFlowIds((prev) => {
      const next = new Set(prev);
      if (next.has(flowId)) next.delete(flowId);
      else next.add(flowId);
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      {data.value.map(({ flow }) => (
        <ExplorerFlowRow
          key={flow.id}
          flow={flow}
          isExpanded={expandedFlowIds.has(flow.id)}
          onToggleExpanded={() => toggleExpanded(flow.id)}
          selectedRowId={selectedRowId}
          onSelectFlow={() => setSelectedRowId(`flow:${flow.id}`)}
          onSelectVersion={(versionId) =>
            setSelectedRowId(`version:${versionId}`)
          }
        />
      ))}
    </div>
  );
}
