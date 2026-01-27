import { describe, it, expect } from "vitest";
import { makeRunPlanPlanner } from "../../src/planners/make-run-plan.planner.js";
import type { MakeRunPlanMsg } from "../../src/types/message.types.js";
import { EmitRunDeniedFx } from "../../src/types/effect.types.js";
import { runIndexResultOkState } from "../fixtures/run-index-result.state.js";
import {
  makeRunPlanNewState,
  makeRunPlanNewStateFAProblems,
} from "../fixtures/make-run-plan.state.js";
import { EmitRunStartedFx } from "../../src/engine.types.js";

describe("makeRunPlanPlanner()", () => {
  it("makes a EmitRunStartedFx effect when run status is 'started'", () => {
    const message: MakeRunPlanMsg = {
      type: "MakeRunPlan",
      runId: "test-runid",
    };

    const effects = makeRunPlanPlanner(
      runIndexResultOkState,
      makeRunPlanNewState,
      message,
    );

    const expectedEffect: EmitRunStartedFx[] = [
      {
        type: "EmitRunStarted",
        data: null,
        scope: {
          flowid: "test-flowdefhash",
          runid: "test-runid",
          source: "lowercase://engine",
        },
        traceId: makeRunPlanNewState.runs["test-runid"].traceId,
      },
    ];
    expect(effects).toEqual(expectedEffect);
  });
  it("makes a EmitRunDeniedFx effect when run status is not 'started'", () => {
    const message: MakeRunPlanMsg = {
      type: "MakeRunPlan",
      runId: "test-runid",
    };

    const effects = makeRunPlanPlanner(
      runIndexResultOkState,
      makeRunPlanNewStateFAProblems,
      message,
    );

    const expectedEffect: EmitRunDeniedFx[] = [
      {
        type: "EmitRunDenied",
        data: {
          error: "Error making run plan.",
        },
        scope: {
          flowid: "test-flowdefhash",
          runid: "test-runid",
          source: "lowercase://engine",
        },
        traceId: runIndexResultOkState.runs["test-runid"].traceId,
      },
    ];

    expect(effects).toEqual(expectedEffect);
  });
});
