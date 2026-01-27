import { RunContext } from "@lcase/types";
import { EngineState } from "../../src/engine.types";
import { flowDef } from "./flow-definition.js";

export const flowDefResultOkTrueState: EngineState = {
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
  flows: {
    // add flow to flows if its not there,
    "test-flowdefhash": {
      definition: flowDef,
      runIds: { "test-runid": true }, // and add run id to it
    },
  },
};

export const flowDefResultNotOkTrueState: EngineState = {
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
      status: "failed", // status changed to failed on ok: false message
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
