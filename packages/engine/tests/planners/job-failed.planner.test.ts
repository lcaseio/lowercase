import type { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import type {
  EngineState,
  FlowFailedMsg,
  JobFailedMsg,
} from "../../src/engine.types.js";
import { FlowDefinition } from "@lcase/types";
import { jobFailedPlanner } from "../../src/planners/job-failed.planner.js";

describe("jobFailedPlanner", () => {
  it("plans internal FlowFailedMsg as DispatchInternalFx given proper state", () => {
    const state = {
      runs: {},
    } satisfies EngineState;

    const runId = "test-runId";
    const stepId = "test-stepId";
    const jobFailedMsg: JobFailedMsg = {
      type: "JobFailed",
      runId,
      stepId,
    };
    const runCtx = {
      flowId: "test-flowId",
      flowName: "test-flowName",
      definition: {
        start: stepId,
        steps: {
          [stepId]: {
            on: {
              failure: "stepTwo",
            },
          },
          stepTwo: {},
        },
      } as unknown as FlowDefinition,
      runId,
      traceId: "test-traceId",
      runningSteps: new Set<string>([stepId]),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>(),
      outstandingSteps: 1,
      inputs: {},
      exports: {},
      globals: {},
      status: "started",
      steps: {
        [stepId]: {
          status: "started",
          attempt: 1,
          exports: {},
          result: {},
          stepId: stepId,
        },
      },
    } satisfies RunContext;

    const newRunCtx = {
      flowId: "test-flowId",
      flowName: "test-flowName",
      definition: {
        start: stepId,
        steps: {
          [stepId]: {
            on: {
              success: "stepTwo",
            },
          },
          stepTwo: {},
        },
      } as unknown as FlowDefinition,
      runId,
      traceId: "test-traceId",
      runningSteps: new Set<string>(),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>([stepId]),
      outstandingSteps: 0,
      inputs: {},
      exports: {},
      globals: {},
      status: "failed",
      steps: {
        [stepId]: {
          status: "failed",
          attempt: 1,
          exports: {},
          result: {},
          stepId,
        },
      },
    } satisfies RunContext;
    const oldState: EngineState = { runs: { [runId]: runCtx } };
    const newState: EngineState = { runs: { [runId]: newRunCtx } };
    const effects = jobFailedPlanner({
      oldState,
      newState,
      message: jobFailedMsg,
    });

    const expectedEffectPlan = {
      kind: "DispatchInternal",
      message: {
        runId,
        stepId,
        type: "FlowFailed",
      } satisfies FlowFailedMsg,
    };

    expect(effects).toEqual([expectedEffectPlan]);
  });
});
