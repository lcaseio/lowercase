import type { RunContext } from "@lcase/types";
import type { EngineState } from "../../src/engine.types";
import { flowAnalysisB } from "./flow-analysis.state";
import { flowDef } from "./flow-definition";

export const runStartedNewState: EngineState = {
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
          b: { outputHash: "test-outputhash", status: "success" },
        },
      },

      runId: "test-runid",
      traceId: "test-traceid",

      // create run plan
      runPlan: {
        reuse: {
          b: {
            status: "success",
            outputHash: "test-outputhash",
          },
        },
      },
      startedSteps: {},
      plannedSteps: { parallel: true }, // add step to object for set like lookup
      completedSteps: {},
      failedSteps: {},
      outstandingSteps: 1, // incremented as planned is considered outstanding
      input: {},
      status: "started",

      steps: {
        b: {
          status: "initialized",
          attempt: 0,
          output: {},
          outputHash: null,
          resolved: {},
        },
        parallel: {
          status: "planned", // change to planned
          attempt: 0,
          output: {},
          outputHash: null,
          resolved: {},
        },
      },

      flowAnalysis: flowAnalysisB,
    } satisfies RunContext,
  },
  flows: {
    "test-flowdefhash": {
      definition: flowDef,
      runIds: { "test-runid": true },
    },
  },
};
