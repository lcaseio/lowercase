import { FlowAnalysis } from "@lcase/types";

const stepId = "test-stepid";
export const flowAnalysis: FlowAnalysis = {
  nodes: ["parallel", stepId],
  inEdges: {
    [stepId]: [
      {
        startStepId: "parallel",
        endStepId: stepId,
        type: "parallel",
        gate: "always",
      },
    ],
  },
  outEdges: {
    parallel: [
      {
        startStepId: "parallel",
        endStepId: stepId,
        type: "parallel",
        gate: "always",
      },
    ],
  },
  joinDeps: {},
  problems: [],
  refs: [],
};
