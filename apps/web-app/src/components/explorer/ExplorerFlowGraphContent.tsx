import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import { useListArtifactsQuery } from "@/redux/api/artifacts-api";
import { useRequestRunMutation } from "@/redux/api/runs-api";
import { FlowGraph } from "@/components/FlowGraph";
import { useFlowAnalysis } from "@/hooks/use-flow-analysis";
import { useRunEventsWithStatus } from "@/hooks/use-run-events-with-status";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ExplorerRunToolbar } from "./ExplorerRunToolbar";
import {
  ExplorerRunRightPanel,
  type ExplorerRunRightPanelTab,
} from "./ExplorerRunRightPanel";

export function ExplorerFlowGraphContent({ versionId }: { versionId: string }) {
  const { data, error, isLoading, refetch } =
    useGetFlowVersionDefQuery(versionId);
  const { data: artifactsData } = useListArtifactsQuery();
  const [requestRun] = useRequestRunMutation();

  const [selectedParamHashes, setSelectedParamHashes] = useState<
    Record<string, string>
  >({});
  const [rightPanelTab, setRightPanelTab] =
    useState<ExplorerRunRightPanelTab | null>(null);
  const [runId, setRunId] = useState<string | null>(null);

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

  const stepIds = flowDef ? Object.keys(flowDef.steps) : [];
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
    setSelectedParamHashes((prev) => {
      const next = { ...prev };
      if (hash) next[name] = hash;
      else delete next[name];
      return next;
    });
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
      setRunId(result.data.runId);
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

  const toolbar = (
    <ExplorerRunToolbar
      hasParams={Object.keys(params).length > 0}
      paramsHasUnsetRequired={missingRequiredParams.length > 0}
      runDisabled={runDisabled}
      onOpenParams={() => setRightPanelTab("params")}
      onOpenSim={() => setRightPanelTab("sim")}
      onRun={handleRun}
    />
  );

  const graph = (
    // keyed on versionId -- this tab is a singleton (one per kind), so
    // opening a different version's graph updates this same component's
    // props in place rather than unmounting it. React Flow keeps a lot of
    // internal state (viewport, measurement cache, edge bookkeeping) tied
    // to one component instance that a plain prop change doesn't reliably
    // reset. The key forces a real remount instead, so each graph always
    // starts from the same clean state the fitView fix already relies on.
    // (This component's own run/param/panel state above is reset the same
    // way, one level up -- ExplorerTabContent.tsx keys *this* component by
    // tab.versionId, so all of it is torn down and recreated fresh whenever
    // a different version's graph reuses this same singleton tab.)
    <FlowGraph
      key={versionId}
      flowDef={flowDef}
      layout={flowAnalysis?.layout ?? null}
      outEdges={flowAnalysis?.flowAnalysis.outEdges ?? {}}
      stepRunInfo={stepRunInfo}
      toolbar={toolbar}
    />
  );

  if (!rightPanelTab) return <div className="h-full">{graph}</div>;

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel defaultSize="70%">{graph}</ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="30%">
        <ExplorerRunRightPanel
          activeTab={rightPanelTab}
          onActiveTabChange={setRightPanelTab}
          onClose={() => setRightPanelTab(null)}
          flowDef={flowDef}
          params={params}
          artifacts={artifacts}
          selectedParamHashes={selectedParamHashes}
          onParamChange={handleParamChange}
          missingRequiredParams={missingRequiredParams}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
