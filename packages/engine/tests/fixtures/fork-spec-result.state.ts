import { RunContext } from "@lcase/types";
import { EngineState } from "../../src/engine.types";
import { flowDef } from "./flow-definition.js";

export const forkSpecOkState: EngineState = {
  runs: {
    ["test-runid"]: {
      flowId: "test-flowdefhash",
      flowDefHash: "test-flowdefhash",
      forkSpecHash: "test-forkspechash",
      forkSpec: {
        parentRunId: "test-parentrunid",
        reuse: ["b"],
      },

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
  flows: {
    "test-flowdefhash": {
      definition: flowDef,
      runIds: { "test-runid": true },
    },
  },
};
export const forkSpecNotOkState: EngineState = {
  runs: {
    ["test-runid"]: {
      flowId: "test-flowdefhash",
      flowDefHash: "test-flowdefhash",
      forkSpecHash: "test-forkspechash",
      //forkSpec?: doesn't save fork spec to state

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
      status: "failed", // run failed
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
  flows: {
    "test-flowdefhash": {
      definition: flowDef,
      runIds: { "test-runid": true },
    },
  },
};
