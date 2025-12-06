import type { RunContext } from "@lcase/types/engine";
import type { EngineState, JobFailedMsg } from "../../src/engine.types.js";
import { describe, it, expect } from "vitest";
import { FlowDefinition } from "@lcase/types";
import { jobFailedReducer } from "../../src/reducers/job-failed.reducer.js";

describe("jobCompletedReducer", () => {
  it("updates empty state correctly", () => {
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
        steps: { [stepId]: {} },
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

    const startState = {
      runs: { [runId]: runCtx },
    } satisfies EngineState;

    const newRunCtx = {
      flowId: "test-flowId",
      flowName: "test-flowName",
      definition: {
        start: stepId,
        steps: { [stepId]: {} },
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
          reason: "test-reason",
        },
      },
    } satisfies RunContext;

    const expectedState: EngineState = {
      runs: {
        [runId]: newRunCtx,
      },
    };
    const newState = jobFailedReducer(startState, jobFailedMsg);
    expect(newState).toEqual(expectedState);
  });

  it("keeps current flow status when there are outstanding steps", () => {
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
        steps: { [stepId]: {} },
      } as unknown as FlowDefinition,
      runId,
      traceId: "test-traceId",
      runningSteps: new Set<string>([stepId, "other"]),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>(),
      outstandingSteps: 2,
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

    const startState = {
      runs: { [runId]: runCtx },
    } satisfies EngineState;

    const newRunCtx = {
      flowId: "test-flowId",
      flowName: "test-flowName",
      definition: {
        start: stepId,
        steps: { [stepId]: {} },
      } as unknown as FlowDefinition,
      runId,
      traceId: "test-traceId",
      runningSteps: new Set<string>(["other"]),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>([stepId]),
      outstandingSteps: 1,
      inputs: {},
      exports: {},
      globals: {},
      status: "started",
      steps: {
        [stepId]: {
          status: "failed",
          attempt: 1,
          exports: {},
          result: {},
          stepId,
          reason: "test-reason",
        },
      },
    } satisfies RunContext;

    const expectedState: EngineState = {
      runs: {
        [runId]: newRunCtx,
      },
    };
    const newState = jobFailedReducer(startState, jobFailedMsg);
    expect(newState).toEqual(expectedState);
  });
});
