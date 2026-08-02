import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { Node } from "@xyflow/react";
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import { useListArtifactsQuery } from "@/redux/api/artifacts-api";
import { useRequestRunMutation } from "@/redux/api/runs-api";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  paramHashSet,
  rightPanelTabSet,
  runSubmitted,
  stepSelected,
  selectFlowGraphPanelState,
} from "@/redux/slices/flow-graph-panels-slice";
import { FlowGraph } from "@/components/FlowGraph";
import { useFlowAnalysis } from "@/hooks/use-flow-analysis";
import { useRunEventsWithStatus } from "@/hooks/use-run-events-with-status";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { RunToolbar } from "./RunToolbar";
import { Rail } from "./Rail";
import { SidePanel } from "./SidePanel";

export function Content({
  versionId,
  panelId,
}: {
  versionId: string;
  panelId: string;
}) {
  const { data, error, isLoading, refetch } =
    useGetFlowVersionDefQuery(versionId);
  const { data: artifactsData } = useListArtifactsQuery();
  const [requestRun] = useRequestRunMutation();

  const dispatch = useAppDispatch();
  const { selectedParamHashes, rightPanelTab, runId, selectedStepId } =
    useAppSelector((state) => selectFlowGraphPanelState(state, panelId));

  const hasError = error || data?.ok === false;
  useEffect(() => {
    if (hasError) {
      toast.error("Couldn't load the flow graph", { duration: Infinity });
    }
  }, [hasError]);

  const flowDef = data?.ok ? data.value.definition : null;
  const version = data?.ok ? data.value.version : null;
  const flowAnalysis = useFlowAnalysis(flowDef);
  const artifacts = artifactsData?.ok ? artifactsData.value : [];
  const problems = flowAnalysis?.flowAnalysis.problems ?? [];

  // stable across renders unless flowDef itself changes -- otherwise a fresh
  // array every render invalidates useStepRunInfo's (and, downstream,
  // FlowGraph's own node/edge) memoization by reference on every unrelated
  // re-render, e.g. just switching the right panel's tab
  const stepIds = useMemo(
    () => (flowDef ? Object.keys(flowDef.steps) : []),
    [flowDef],
  );
  const { events, stepRunInfo } = useRunEventsWithStatus(runId, stepIds);

  const params = flowDef?.params ?? {};
  const requiredParamNames = Object.entries(params)
    .filter(([, def]) => def.optional !== true)
    .map(([name]) => name);
  const missingRequiredParams = requiredParamNames.filter(
    (name) => !selectedParamHashes[name],
  );
  const runInFlight =
    runId !== null &&
    !events.some((e) => e.type === "run.completed" || e.type === "run.failed");
  const runDisabled = missingRequiredParams.length > 0 || runInFlight;

  const handleParamChange = (name: string, hash: string | undefined) => {
    dispatch(paramHashSet({ panelId, name, hash }));
  };

  // No run active -> Step Details (static definition); run active ->
  // Step Results (status/output/exports) instead. Either tab stays
  // manually selectable via the rail regardless of run state -- this only
  // gates the auto-switch on node click.
  const handleNodeClick = (node: Node) => {
    dispatch(stepSelected({ panelId, stepId: node.id }));
    dispatch(
      rightPanelTabSet({
        panelId,
        tab: runId ? "stepresults" : "stepdetails",
      }),
    );
  };

  const handleRun = async () => {
    if (!flowDef || !version) return;
    const entries = Object.entries(selectedParamHashes).filter(([, hash]) =>
      Boolean(hash),
    );
    const result = await requestRun({
      flowId: version.flowId,
      flowVersionId: versionId,
      flowDefHash: version.definitionHash,
      ...(entries.length > 0 ? { params: Object.fromEntries(entries) } : {}),
    });
    if (result.data?.ok) {
      dispatch(runSubmitted({ panelId, runId: result.data.runId }));
    }
  };

  if (isLoading) return <div className="p-4">Loading flow graph...</div>;
  if (hasError)
    return (
      <div className="p-4 text-sm text-destructive">
        Couldn't load the flow graph.{" "}
        <button className="underline" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  if (!flowDef) return null;
  if (!version) return null;

  const toolbar = (
    <RunToolbar
      hasParams={Object.keys(params).length > 0}
      paramsHasUnsetRequired={missingRequiredParams.length > 0}
      runDisabled={runDisabled}
      onOpenParams={() =>
        dispatch(rightPanelTabSet({ panelId, tab: "runinput" }))
      }
      onOpenSim={() => dispatch(rightPanelTabSet({ panelId, tab: "sim" }))}
      onRun={handleRun}
    />
  );

  const graph = (
    <FlowGraph
      flowDef={flowDef}
      layout={flowAnalysis?.layout ?? null}
      outEdges={flowAnalysis?.flowAnalysis.outEdges ?? {}}
      stepRunInfo={stepRunInfo}
      toolbar={toolbar}
      onNodeClickHandler={handleNodeClick}
    />
  );

  if (!rightPanelTab) {
    return (
      <div className="flex h-full">
        <div className="flex-1">{graph}</div>
        <Rail
          activeTab={rightPanelTab}
          onSelectTab={(tab) => dispatch(rightPanelTabSet({ panelId, tab }))}
          problemsCount={problems.length}
        />
      </div>
    );
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel defaultSize="70%">{graph}</ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="30%" minSize="15%">
        <div className="flex h-full">
          <Rail
            activeTab={rightPanelTab}
            onSelectTab={(tab) => dispatch(rightPanelTabSet({ panelId, tab }))}
            problemsCount={problems.length}
          />
          <div className="flex-1 min-w-0">
            <SidePanel
              activeTab={rightPanelTab}
              onClose={() => dispatch(rightPanelTabSet({ panelId, tab: null }))}
              flowDef={flowDef}
              params={params}
              artifacts={artifacts}
              selectedParamHashes={selectedParamHashes}
              onParamChange={handleParamChange}
              missingRequiredParams={missingRequiredParams}
              problems={problems}
              selectedStepId={selectedStepId}
              version={version}
              refs={flowAnalysis?.flowAnalysis.refs ?? []}
              stepRunInfo={stepRunInfo}
              runId={runId}
            />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
