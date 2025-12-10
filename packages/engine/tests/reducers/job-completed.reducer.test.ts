import type { RunContext } from "@lcase/types/engine";
import { jobCompletedReducer } from "../../src/reducers/job-completed.reducer.js";
import type { EngineState, JobCompletedMsg } from "../../src/engine.types.js";
import { describe, it, expect } from "vitest";
import type { FlowDefinition } from "@lcase/types";

describe("jobCompletedReducer", () => {
  it("updates empty state correctly", () => {
    const runId = "test-runId";
    const stepId = "test-stepId";
    const jobCompletedMsg: JobCompletedMsg = {
      type: "JobCompleted",
      runId,
      stepId,
      result: { foo: "bar" },
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
          joins: new Set<string>(),
          resolved: {},
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
      activeJoinSteps: new Set<string>(),
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
          result: { foo: "bar" },
          stepId,
          joins: new Set(),
          resolved: {},
        },
      },
    } satisfies RunContext;

    const expectedState: EngineState = {
      runs: {
        [runId]: newRunCtx,
      },
    };
    const newState = jobCompletedReducer(startState, jobCompletedMsg);
    expect(newState).toEqual(expectedState);
  });

  it("keeps current flow status when there are outstanding steps", () => {
    const runId = "test-runId";
    const stepId = "test-stepId";
    const jobCompletedMsg: JobCompletedMsg = {
      type: "JobCompleted",
      runId,
      stepId,
      result: { foo: "bar" },
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
      runningSteps: new Set<string>([stepId, "two"]),
      queuedSteps: new Set<string>(),
      activeJoinSteps: new Set<string>(),
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
          joins: new Set(),
          resolved: {},
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
      runningSteps: new Set<string>(["two"]),
      activeJoinSteps: new Set<string>(),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>([stepId]),
      outstandingSteps: 1,
      inputs: {},
      exports: {},
      globals: {},
      status: "started",
      steps: {
        [stepId]: {
          status: "completed",
          attempt: 1,
          exports: {},
          result: { foo: "bar" },
          stepId,
          joins: new Set(),
          resolved: {},
        },
      },
    } satisfies RunContext;

    const expectedState: EngineState = {
      runs: {
        [runId]: newRunCtx,
      },
    };
    const newState = jobCompletedReducer(startState, jobCompletedMsg);
    expect(newState).toEqual(expectedState);
  });
});
