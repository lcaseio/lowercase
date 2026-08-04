import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { skipToken } from "@reduxjs/toolkit/query";
import type { Node } from "@xyflow/react";
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import { useListArtifactsQuery } from "@/redux/api/artifacts-api";
import {
  useGetRunDetailQuery,
  useRequestRunMutation,
} from "@/redux/api/runs-api";
import { useGetSimQuery } from "@/redux/api/sims-api";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  paramHashSet,
  rightPanelTabSet,
  runSubmitted,
  runSelected,
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
import { useDockviewApi } from "../explorer-dockview-context";
import { openOrFocusPanel } from "../explorer-panels";
import { RunToolbar } from "./RunToolbar";
import { Rail } from "./Rail";
import { SidePanel } from "./SidePanel";

export function Content({
  versionId,
  panelId,
  simId,
}: {
  versionId: string;
  panelId: string;
  simId?: string;
}) {
  const { data, error, isLoading, refetch } =
    useGetFlowVersionDefQuery(versionId);
  const { data: artifactsData } = useListArtifactsQuery();
  const dockviewApi = useDockviewApi();
  const { data: simDefData } = useGetSimQuery(simId ? { simId } : skipToken);
  const [requestRun] = useRequestRunMutation();

  const dispatch = useAppDispatch();
  const { selectedParamHashes, rightPanelTab, runId, selectedStepId } =
    useAppSelector((state) => selectFlowGraphPanelState(state, panelId));
  const simDefinition = simDefData?.ok ? simDefData.value : null;

  // Broader than `simId`/`simDefinition` above (which only ever reflect
  // *this panel having been opened directly from a sim*): this also covers
  // a plain or run-specific panel whose currently-displayed run just
  // happens to have used a sim. Only feeds the Sim tab's identity display
  // -- seeding, handleRun's forkSpecHash, and the reuse overlay all stay
  // keyed on the explicit `simId` prop only, unchanged.
  const { data: runDetailData } = useGetRunDetailQuery(
    runId ? { runId } : skipToken,
  );
  const activeRunSimId =
    simId ?? (runDetailData?.ok ? runDetailData.value.run.simId : undefined);
  const { data: activeSimDefData } = useGetSimQuery(
    activeRunSimId ? { simId: activeRunSimId } : skipToken,
  );
  const activeSimDefinition = activeSimDefData?.ok
    ? activeSimDefData.value
    : null;

  // Seeds this panel's runId from the sim's parent run exactly once, on
  // first mount -- gated on runId still being null so it never re-fires
  // once a real run's been submitted from this panel (or been restored
  // from persistence).
  useEffect(() => {
    if (simId && simDefinition && runId === null) {
      dispatch(runSelected({ panelId, runId: simDefinition.spec.parentRunId }));
    }
  }, [simId, simDefinition, runId, panelId, dispatch]);

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

  // Only set while still looking at the sim's own parent run -- stops
  // applying the moment you run something new from this panel, since the
  // reuse plan only ever described that original parent run.
  const reuse =
    simDefinition && runId === simDefinition.spec.parentRunId
      ? simDefinition.spec.reuse
      : null;
  const reusedStepIds = reuse ?? undefined;
  const isReusedForSelectedStep =
    reuse && selectedStepId ? reuse.includes(selectedStepId) : undefined;

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
      ...(simId && simDefinition
        ? { simId, forkSpecHash: simDefinition.sim.forkSpecHash }
        : {}),
    });
    if (result.data?.ok) {
      dispatch(runSubmitted({ panelId, runId: result.data.runId }));
    }
  };

  // Opens (or focuses) the singleton EventGraph panel. "Event Graph" is a
  // deliberately generic label, not describing current content, since the
  // panel has no per-instance identity to name. initialTrackedPanelId is a
  // one-shot seed passed as this panel's own id (see
  // use-tracked-flow-graph-panel.ts for why it can't just ask dockview who's
  // active) -- has no effect on an already-open singleton.
  const handleOpenEventGraph = () => {
    if (!dockviewApi) return;
    openOrFocusPanel(
      dockviewApi,
      {
        kind: "event-graph",
        label: "Event Graph",
        initialTrackedPanelId: panelId,
      },
      { position: { direction: "below", referencePanel: panelId } },
    );
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
      onOpenEventGraph={handleOpenEventGraph}
      onRun={handleRun}
    />
  );

  const graph = (
    <FlowGraph
      flowDef={flowDef}
      layout={flowAnalysis?.layout ?? null}
      outEdges={flowAnalysis?.flowAnalysis.outEdges ?? {}}
      stepRunInfo={stepRunInfo}
      reusedStepIds={reusedStepIds}
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
              simDefinition={activeSimDefinition}
              isReusedForSelectedStep={isReusedForSelectedStep}
            />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
