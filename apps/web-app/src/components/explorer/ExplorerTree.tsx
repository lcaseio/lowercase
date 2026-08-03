import { useState } from "react";
import { useGetFlowsQuery } from "@/redux/api/flows-api";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { useAppDispatch } from "@/redux/typed-hooks";
import { runSelected } from "@/redux/slices/flow-graph-panels-slice";
import { useDockviewApi } from "./explorer-dockview-context";
import { explorerPanelId, openOrFocusPanel } from "./explorer-panels";
import { ExplorerFlowRow } from "./ExplorerFlowRow";

export function ExplorerTree() {
  const api = useDockviewApi();
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
            if (!api) return;
            openOrFocusPanel(api, {
              kind: "flow-settings",
              label: `${flow.name} Settings`,
              flowId: flow.id,
            });
          }}
          onSelectVersion={(versionId) => {
            setSelectedRowId(`version:${versionId}`);
          }}
          onSelectFlowGraph={(version) => {
            setSelectedRowId(`flow-graph:${version.id}`);
            if (!api) return;
            openOrFocusPanel(api, {
              kind: "flow-graph",
              label: `${version.versionLabel ?? `Version ${version.sequence}`} Graph`,
              versionId: version.id,
            });
          }}
          onSelectJsonDefinition={(version) => {
            setSelectedRowId(`json-definition:${version.id}`);
            if (!api) return;
            openOrFocusPanel(api, {
              kind: "json-definition",
              label: `${version.versionLabel ?? `Version ${version.sequence}`} JSON`,
              versionId: version.id,
            });
          }}
          onSelectRun={(version, run) => {
            setSelectedRowId(`run:${run.runId}`);
            const label = `${version.versionLabel ?? `Version ${version.sequence}`} — ${
              run.startTime
                ? new Date(run.startTime).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : run.runId
            }`;
            const req = {
              kind: "flow-graph" as const,
              label,
              versionId: version.id,
              runId: run.runId,
            };
            dispatch(
              runSelected({ panelId: explorerPanelId(req), runId: run.runId }),
            );
            if (api) openOrFocusPanel(api, req);
          }}
          onSelectSim={(version, sim) => {
            setSelectedRowId(`sim:${sim.id}`);
            if (!api) return;
            openOrFocusPanel(api, {
              kind: "flow-graph",
              label: `${version.versionLabel ?? `Version ${version.sequence}`} — ${sim.name}`,
              versionId: version.id,
              simId: sim.id,
            });
          }}
        />
      ))}
    </div>
  );
}
