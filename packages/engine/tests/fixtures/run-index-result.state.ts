import type { RunContext } from "@lcase/types";
import type { EngineState } from "../../src/engine.types.js";
import { flowDef } from "./flow-definition.js";

export const runIndexResultOkState: EngineState = {
  runs: {
    ["test-runid"]: {
      flowId: "test-flowdefhash",
      flowDefHash: "test-flowdefhash",
      forkSpecHash: "test-forkspechash",
      forkSpec: {
        parentRunId: "test-parentrunid",
        reuse: ["b"],
      },
      runIndex: {
        flowId: "test-flowdefhash",
        traceId: "test-traceid",
        steps: {
          b: { outputHash: "test-outputhash" },
        },
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

export const runIndexResultNotOkState: EngineState = {
  runs: {
    ["test-runid"]: {
      flowId: "test-flowdefhash",
      flowDefHash: "test-flowdefhash",
      forkSpecHash: "test-forkspechash",
      forkSpec: {
        parentRunId: "test-parentrunid",
        reuse: ["b"],
      },
      // runIndex - missing run index

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
      status: "failed", // status set to failed
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
