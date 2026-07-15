import { useOutletContext } from "react-router-dom";
import type { FlowDefinition, FlowVersionRecord } from "@lcase/types";
import type { useFlowAnalysis } from "@/hooks/use-flow-analysis";

export type FlowVersionOutletContext = {
  flowDef: FlowDefinition | null;
  flowAnalysis: ReturnType<typeof useFlowAnalysis>;
  flowId: string | null;
  flowVersionId: string | null;
  flowVersionRecord: FlowVersionRecord | null;
};

export function useFlowVersionOutletContext() {
  return useOutletContext<FlowVersionOutletContext>();
}
