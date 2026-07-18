import { Link, Outlet, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import { useFlowAnalysis } from "@/hooks/use-flow-analysis";
import { FlowVersionModeNav } from "./FlowVersionModeNav";
import type { FlowVersionOutletContext } from "./context";

// flow version workspace root with outlet for sub pages
export function FlowVersionWorkspace() {
  const { flowId, versionId } = useParams<{
    flowId: string;
    versionId: string;
  }>();
  const { data, isLoading } = useGetFlowVersionDefQuery(versionId ?? skipToken);
  const flowDef = data?.ok ? data.value.definition : null;
  const flowVersionRecord = data?.ok ? data.value.version : null;
  const flowAnalysis = useFlowAnalysis(flowDef);

  if (isLoading) {
    return <div className="p-4">Loading flow version...</div>;
  }

  if (!data?.ok || !flowDef) {
    return (
      <div className="p-4">
        Flow version not found.{" "}
        <Link to="/flows" className="underline">
          Back to Flows
        </Link>
      </div>
    );
  }

  const outletContext: FlowVersionOutletContext = {
    flowDef,
    flowAnalysis,
    flowId: flowVersionRecord?.flowId ?? flowId ?? null,
    flowVersionId: versionId ?? null,
    flowVersionRecord,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex flex-row justify-center">
          <h2 className="text-xl font-bold mb-3 mt-3 ml-3 text-sky-800 dark:text-sky-300">
            {flowDef.name} - version {flowDef.version}
          </h2>
        </div>
        <div className="flex-1 min-h-0">
          <Outlet context={outletContext} />
        </div>
      </div>
      <FlowVersionModeNav />
    </div>
  );
}
