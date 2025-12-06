import type { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import type {
  DispatchInternalFx,
  EngineState,
  JobCompletedMsg,
  StepReadyToStartMsg,
} from "../../src/engine.types.js";
import type { FlowDefinition } from "@lcase/types";
import { jobCompletedPlanner } from "../../src/planners/job-completed.planner.js";

describe("stepReadyToStartPlanner", () => {
  it("gives correct effects for a proper message and context", () => {
    const state = {
      runs: {},
    } satisfies EngineState;

    const runId = "test-runId";
    const stepId = "test-stepId";
    const jobCompletedMsg: JobCompletedMsg = {
      type: "JobCompleted",
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
              success: "stepTwo",
            },
          },
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
      status: "completed",
      steps: {
        [stepId]: {
          status: "completed",
          attempt: 1,
          exports: {},
          result: {},
          stepId,
        },
      },
    } satisfies RunContext;
    const oldState: EngineState = { runs: { [runId]: runCtx } };
    const newState: EngineState = { runs: { [runId]: newRunCtx } };
    const effects = jobCompletedPlanner({
      oldState,
      newState,
      message: jobCompletedMsg,
    });

    const expectedEffectPlan = {
      kind: "DispatchInternal",
      message: {
        runId,
        stepId: "stepTwo",
        type: "StepReadyToStart",
      } satisfies StepReadyToStartMsg,
    } satisfies DispatchInternalFx;

    expect(effects).toEqual([expectedEffectPlan]);
  });
});
