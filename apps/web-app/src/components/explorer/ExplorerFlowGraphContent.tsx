import { useEffect } from "react";
import { toast } from "sonner";
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import { FlowGraph } from "@/components/FlowGraph";
import { useFlowAnalysis } from "@/hooks/use-flow-analysis";

export function ExplorerFlowGraphContent({ versionId }: { versionId: string }) {
  const { data, error, isLoading, refetch } =
    useGetFlowVersionDefQuery(versionId);

  const hasError = error || data?.ok === false;
  useEffect(() => {
    if (hasError) {
      toast.error("Couldn't load the flow graph", { duration: Infinity });
    }
  }, [hasError]);

  const flowDef = data?.ok ? data.value.definition : null;
  const flowAnalysis = useFlowAnalysis(flowDef);

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

  return (
    // keyed on versionId -- this tab is a singleton (one per kind), so
    // opening a different version's graph updates this same component's
    // props in place rather than unmounting it. React Flow keeps a lot of
    // internal state (viewport, measurement cache, edge bookkeeping) tied
    // to one component instance that a plain prop change doesn't reliably
    // reset. The key forces a real remount instead, so each graph always
    // starts from the same clean state the fitView fix already relies on.
    <FlowGraph
      key={versionId}
      flowDef={flowDef}
      layout={flowAnalysis?.layout ?? null}
      outEdges={flowAnalysis?.flowAnalysis.outEdges ?? {}}
    />
  );
}
