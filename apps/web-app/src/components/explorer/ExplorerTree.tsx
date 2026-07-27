import { useState } from "react";
import { useGetFlowsQuery } from "@/redux/api/flows-api";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { useAppDispatch } from "@/redux/typed-hooks";
import { openOrFocusTab } from "@/redux/slices/explorer-tabs-slice";
import { ExplorerFlowRow } from "./ExplorerFlowRow";

export function ExplorerTree() {
  const dispatch = useAppDispatch();
  const { data, error, isLoading } = useGetFlowsQuery();
  const showLoading = useDelayedLoading(isLoading);
  const [expandedFlowIds, setExpandedFlowIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  if (isLoading) return showLoading ? <div>Loading flows...</div> : null;
  if (data?.ok === false) return <div>Error loading flows: {data.error}</div>;
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
      <div className="pt-3"></div>
      {data.value.map(({ flow }) => (
        <ExplorerFlowRow
          key={flow.id}
          flow={flow}
          isExpanded={expandedFlowIds.has(flow.id)}
          onToggleExpanded={() => toggleExpanded(flow.id)}
          selectedRowId={selectedRowId}
          onSelectFlow={() => {
            setSelectedRowId(`flow:${flow.id}`);
          }}
          onSelectFlowSettings={() => {
            setSelectedRowId(`flow-settings:${flow.id}`);
            dispatch(
              openOrFocusTab({
                kind: "placeholder-flow-settings",
                label: `${flow.name} Settings`,
                flowId: flow.id,
              }),
            );
          }}
          onSelectVersion={(versionId) => {
            setSelectedRowId(`version:${versionId}`);
            dispatch(
              openOrFocusTab({
                kind: "placeholder-version",
                label: `Version ${versionId.slice(0, 8)}`,
                versionId,
              }),
            );
          }}
        />
      ))}
    </div>
  );
}
