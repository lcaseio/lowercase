import { RunContext } from "@lcase/types";
import { EngineState } from "../../src/engine.types";
import { flowDef, flowDefWithProblems } from "./flow-definition";
import { flowAnalysisB, flowAnalysisBWithProblem } from "./flow-analysis.state";

// changes to state are marked on happy path
export const makeRunPlanNewState: EngineState = {
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
      plannedSteps: {},
      completedSteps: {},
      failedSteps: {},
      outstandingSteps: 0,
      input: {},
      status: "started", // change status to started

      // initialize steps
      steps: {
        b: {
          status: "initialized",
          attempt: 0,
          output: {},
          outputHash: null,
          resolved: {},
        },
        parallel: {
          status: "initialized",
          attempt: 0,
          output: {},
          outputHash: null,
          resolved: {},
        },
      },

      flowAnalysis: flowAnalysisB, // add completed flow analysis
    } satisfies RunContext,
  },
  flows: {
    "test-flowdefhash": {
      definition: flowDef,
      runIds: { "test-runid": true },
    },
  },
};

export const makeRunPlanNewStateFAProblems: EngineState = {
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

      // run plan is empty
      runPlan: {
        reuse: {},
      },
      startedSteps: {},
      plannedSteps: {},
      completedSteps: {},
      failedSteps: {},
      outstandingSteps: 0,
      input: {},
      status: "failed", // change status to failed

      // don't initialize steps when flowAnalysis has problems
      steps: {},

      flowAnalysis: flowAnalysisBWithProblem, // add flow analysis with problems
    } satisfies RunContext,
  },
  flows: {
    "test-flowdefhash": {
      definition: flowDefWithProblems,
      runIds: { "test-runid": true },
    },
  },
};
