import { describe, it, expect } from "vitest";
import { startJoinPlanner } from "../../src/planners/start-join.planner";
import {
  EmitJoinStepStartedFx,
  EngineState,
  StartJoinMsg,
} from "../../src/engine.types";
import { RunContext } from "@lcase/types/engine";

describe("startJoinPlanner", () => {
  it("creates EmitJoinStepStartedFx object", () => {
    const runId = "test-runId";
    const stepId = "test-stepId";
    const joinStepId = "test-joinId";

    const message = {
      type: "StartJoin",
      runId,
      stepId,
      joinStepId,
    } satisfies StartJoinMsg;

    const oldRunCtx = {
      flowId: "flowId",
      traceId: "traceId",
      definition: {
        steps: {
          [joinStepId]: {
            steps: ["one", "two"],
            type: "join",
          },
        },
      },
      steps: {
        [joinStepId]: {
          status: "pending",
        },
      },
    } as unknown as RunContext;

    const newRunCtx = {
      flowId: "flowId",
      traceId: "traceId",
      definition: {
        steps: {
          [joinStepId]: {
            steps: ["one", "two"],
            type: "join",
          },
        },
      },
      steps: {
        [joinStepId]: {
          status: "started",
        },
      },
    } as unknown as RunContext;

    const oldState = { runs: { [runId]: oldRunCtx } } satisfies EngineState;
    const newState = { runs: { [runId]: newRunCtx } } satisfies EngineState;

    const expectedEffects = [
      {
        kind: "EmitJoinStepStarted",
        scope: {
          flowid: newRunCtx.flowId,
          runid: runId,
          source: "lowercase://engine",
          stepid: joinStepId,
          steptype: "join",
        },
        data: {
          status: "started",
          step: {
            id: joinStepId,
            name: joinStepId,
            type: "join",
            joinFrom: ["one", "two"],
          },
        },
        traceId: "traceId",
      } satisfies EmitJoinStepStartedFx,
    ];
    const effects = startJoinPlanner({ oldState, newState, message });

    expect(effects).toEqual(expectedEffects);
  });
});
