import { RunContext } from "@lcase/types";
import { EngineState } from "../../src/engine.types";

export const runRequestedOldState: EngineState = {
  runs: {},
  flows: {},
};

export const runRequestedNewState: EngineState = {
  runs: {
    ["test-runid"]: {
      flowId: "test-flowdefhash",
      flowDefHash: "test-flowdefhash",

      runId: "test-runid",
      traceId: "test-traceid",
      runPlan: {
        reuse: {},
      },
      startedSteps: {},
      plannedSteps: {},
      completedSteps: {},
      failedSteps: {},
      outstandingSteps: 0,
      input: {},
      status: "requested",
      steps: {},
      flowAnalysis: {
        nodes: [],
        inEdges: {},
        outEdges: {},
        joinDeps: {},
        problems: [],
        refs: [],
      },
    } satisfies RunContext,
  },
  flows: {},
};
