import { useOutletContext } from "react-router-dom";
import type { FlowDefinition } from "@lcase/types";
import type { useFlowAnalysis } from "@/hooks/use-flow-analysis";

export type FlowVersionOutletContext = {
  flowDef: FlowDefinition | null;
  flowAnalysis: ReturnType<typeof useFlowAnalysis>;
};

export function useFlowVersionOutletContext() {
  return useOutletContext<FlowVersionOutletContext>();
}
