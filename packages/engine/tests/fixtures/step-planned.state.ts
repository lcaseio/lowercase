import type { RunContext } from "@lcase/types";
import type { EngineState } from "../../src/engine.types";

import { flowAnalysisB } from "./flow-analysis.state";
import { flowDef } from "./flow-definition";

export const stepPlannedNewState: EngineState = {
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
      startedSteps: { parallel: true }, // added to started
      plannedSteps: {}, // remove from planned
      completedSteps: {},
      failedSteps: {},
      outstandingSteps: 1,
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
          status: "started", // change to started
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
