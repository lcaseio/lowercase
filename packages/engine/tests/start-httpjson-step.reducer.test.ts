import { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import { EngineState, StartHttjsonStepMsg } from "../src/engine";
import { startHttpjsonStepReducer } from "../src/reducers/start-httpjson-step.reducer.js";

describe("stepReadyToStartReducer", () => {
  it("increments attempt, outstanding steps, and running steps correctly", () => {
    const state = {
      runs: {},
    } satisfies EngineState;

    const stepReadyToStartMsg: StartHttjsonStepMsg = {
      type: "StartHttpjsonStep",
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
      status: "started",
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
    const newRunContext = {
      ...runCtx,
      status: "started",
      outstandingSteps: 1,
      runningSteps: new Set([...runCtx.runningSteps, "test-stepId"]),
      steps: {
        "test-stepId": {
          ...runCtx.steps["test-stepId"],
          status: "started",
          attempt: 1,
        },
      },
    };
    const testNewState = { runs: { ["test-id"]: newRunContext } };
    const reducerState = startHttpjsonStepReducer(
      startState,
      stepReadyToStartMsg
    );

    expect(reducerState).toEqual(testNewState);
    expect(reducerState).toEqual(testNewState);
  });
});
