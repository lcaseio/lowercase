import { describe, it, expect } from "vitest";
import { runIndexResultPlanner } from "../../src/planners/run-index-result.planner.js";
import type { RunIndexResultMsg } from "../../src/types/message.types.js";
import { forkSpecOkState } from "../fixtures/fork-spec-result.state.js";
import {
  EmitRunDeniedFx,
  MakeRunPlanFx,
} from "../../src/types/effect.types.js";
import {
  runIndexResultNotOkState,
  runIndexResultOkState,
} from "../fixtures/run-index-result.state.js";

describe("runIndexResultPlanner()", () => {
  it("makes a MakeRunPlanFx effect when a runIndex was added to state", () => {
    const message: RunIndexResultMsg = {
      ok: true,
      runId: "test-runid",
      runIndex: {
        flowId: "test-flowdefhash",
        traceId: "test-traceid",
        steps: {
          b: { outputHash: "test-outputhash" },
        },
      },
      type: "RunIndexResult",
    };

    const effects = runIndexResultPlanner(
      forkSpecOkState,
      runIndexResultOkState,
      message,
    );

    const expectedEffect: MakeRunPlanFx[] = [
      {
        type: "MakeRunPlan",
        runId: "test-runid",
      },
    ];
    expect(effects).toEqual(expectedEffect);
  });
  it("makes a EmitRunDeniedFx effect when a runIndex was not added to state", () => {
    const message: RunIndexResultMsg = {
      ok: false,
      runId: "test-runid",
      type: "RunIndexResult",
      error: "test-error",
    };

    const effects = runIndexResultPlanner(
      forkSpecOkState,
      runIndexResultNotOkState,
      message,
    );

    const expectedEffect: EmitRunDeniedFx[] = [
      {
        type: "EmitRunDenied",
        data: {
          error: "test-error",
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
