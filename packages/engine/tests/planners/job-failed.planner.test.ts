import type { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import type {
  EmitStepFailedFx,
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
      reason: "test-reason",
    };
    const runCtx = {
      flowId: "test-flowId",
      flowName: "test-flowName",
      definition: {
        start: stepId,
        steps: {
          [stepId]: {
            type: "httpsjson",
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
      activeJoinSteps: new Set<string>(),
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
          joins: new Set(),
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
            type: "httpjson",
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
      activeJoinSteps: new Set<string>(),
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
          reason: "test-reason",
          joins: new Set(),
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

    const emitStepFailedFx = {
      kind: "EmitStepFailed",
      eventType: "step.failed",
      scope: {
        flowid: newRunCtx.flowId,
        runid: runId,
        source: "lowercase://engine",
        stepid: stepId,
        steptype: "httpjson",
      },
      data: {
        status: "failure",
        step: {
          id: stepId,
          name: stepId,
          type: "httpjson",
        },
        reason: "test-reason",
      },
      traceId: newRunCtx.traceId,
    } satisfies EmitStepFailedFx;

    const dispatchInternalFx = {
      kind: "DispatchInternal",
      message: {
        runId,
        stepId,
        type: "FlowFailed",
      } satisfies FlowFailedMsg,
    };

    expect(effects).toEqual([emitStepFailedFx, dispatchInternalFx]);
  });
});
