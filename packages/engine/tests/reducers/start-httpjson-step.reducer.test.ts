import { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import type {
  EngineState,
  StartHttpJsonStepMsg,
} from "../../src/engine.types.js";
import { startHttpJsonStepReducer } from "../../src/reducers/start-httpjson-step.reducer.js";

describe("startHttpJsonStepReducer", () => {
  it("increments attempt, outstanding steps, and running steps correctly", () => {
    const state = {
      runs: {},
    } satisfies EngineState;

    const stepReadyToStartMsg: StartHttpJsonStepMsg = {
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
      activeJoinSteps: new Set<string>(),
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
          joins: new Set(),
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
    const reducerState = startHttpJsonStepReducer(
      startState,
      stepReadyToStartMsg
    );

    expect(reducerState).toEqual(testNewState);
    expect(reducerState).toEqual(testNewState);
  });
});
