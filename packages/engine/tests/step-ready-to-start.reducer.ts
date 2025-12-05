import { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import { flowSubmittedPlanner } from "../src/planners/flow-submitted.planner";
import { EngineEffect, EngineState, StepReadyToStartMsg } from "../src/engine";
import { stepReadyToStartPlanner } from "../src/planners/step-ready-to-start.planner";
import { stepReadyToStartReducer } from "../src/reducers/step-ready-to-start.reducer";

describe("stepReadyToStartReducer", () => {
  it("", () => {
    const state = {
      runs: {},
    } satisfies EngineState;

    const stepReadyToStartMsg: StepReadyToStartMsg = {
      type: "StepReadyToStart",
      runId: "test-id",
      stepId: "test-stepId",
    };

    const runCtx = {
      flowId: "",
      flowName: "",
      definition: {
        name: "",
        version: "",
        start: "",
        steps: {
          "test-stepId": {
            type: "httpjson",
            url: "",
          },
        },
      },
      runId: "test-id",
      traceId: "",
      runningSteps: new Set<string>(),
      queuedSteps: new Set<string>(),
      doneSteps: new Set<string>(),
      outstandingSteps: 0,
      inputs: {},
      exports: {},
      globals: {},
      status: "pending",
      steps: {
        "test-stepId": {
          status: "pending",
          attempt: 0,
          exports: {},
          result: {},
          stepId: "start",
        },
      },
    } satisfies RunContext;
    const startState = { runs: { ["test-id"]: runCtx } };
    const newRunContext = { ...runCtx, status: "started" };
    const testNewState = { runs: { ["test-id"]: newRunContext } };
    const reducerState = stepReadyToStartReducer(
      startState,
      stepReadyToStartMsg
    );

    expect(reducerState).toEqual(testNewState);
  });
});
