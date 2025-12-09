import { RunContext } from "@lcase/types/engine";
import { describe, it, expect } from "vitest";
import type { EngineState, StartJoinMsg } from "../../src/engine.types.js";
import { startJoinReducer } from "../../src/reducers/start-join.reducer.js";

describe("startJoinReducer", () => {
  it("changes join step status to started and adds to activeJoinSteps", () => {
    const state = {
      runs: {},
    } satisfies EngineState;

    const runCtx = {
      runId: "test-id",
      activeJoinSteps: new Set<string>(),
      steps: {
        "test-joinStepId": {
          status: "pending",
          joins: new Set(),
        },
      },
    } as unknown as RunContext;

    const startJoinMsg: StartJoinMsg = {
      type: "StartJoin",
      runId: "test-id",
      stepId: "test-stepId",
      joinStepId: "test-joinStepId",
    };

    const startState = { runs: { ["test-id"]: runCtx } };
    const newRunContext = {
      ...runCtx,
      activeJoinSteps: new Set<string>(["test-joinStepId"]),
      steps: {
        "test-joinStepId": {
          ...runCtx.steps["test-joinStepId"],
          status: "started",
        },
      },
    };
    const testNewState = { runs: { ["test-id"]: newRunContext } };
    const reducerState = startJoinReducer(startState, startJoinMsg);

    expect(reducerState).toEqual(testNewState);
    expect(testNewState).not.toEqual(startState);
  });
});
