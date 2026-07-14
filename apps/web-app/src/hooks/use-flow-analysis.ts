import { useMemo } from "react";
import {
  analyzeFlow,
  analyzeRefs,
  graphLayout,
  toposort,
} from "@lcase/flow-analysis";
import type { FlowDefinition } from "@lcase/types";

export function useFlowAnalysis(flowDef: FlowDefinition | null) {
  return useMemo(() => {
    if (!flowDef) return null;

    let fa = analyzeFlow(flowDef);
    fa = analyzeRefs(flowDef, fa);
    fa.toposort = toposort(fa);
    console.log("toposort", fa.toposort);

    return { flowAnalysis: fa, layout: graphLayout(fa) };
  }, [flowDef]);
}
