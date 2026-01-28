import { describe, it, expect } from "vitest";
import { makeRunPlanReducer } from "../../src/reducers/make-run-plan.reducer.js";
import type { MakeRunPlanMsg } from "../../src/types/message.types.js";

import {
  runIndexResultNotOkState,
  runIndexResultOkState,
} from "../fixtures/run-index-result.state.js";
import {
  makeRunPlanNewState,
  makeRunPlanNewStateFAProblems,
} from "../fixtures/make-run-plan.state.js";
import { flowDefWithProblems } from "../fixtures/flow-definition.js";

describe("makeRunPlanReducer()", () => {
  it("makes a run plan when FlowAnalysis + ForkSpec + RunIndex are valid", () => {
    const message: MakeRunPlanMsg = {
      type: "MakeRunPlan",
      runId: "test-runid",
    };
    const state = makeRunPlanReducer(runIndexResultOkState, message);
    expect(state).toEqual(makeRunPlanNewState);
  });
  it("does not make a run plan when flow analysis has problems", () => {
    const flowDefWithProblemsState = structuredClone(runIndexResultOkState);
    flowDefWithProblemsState.flows["test-flowdefhash"].definition =
      flowDefWithProblems;
    const message: MakeRunPlanMsg = {
      type: "MakeRunPlan",
      runId: "test-runid",
    };
    const state = makeRunPlanReducer(flowDefWithProblemsState, message);
    expect(state).toEqual(makeRunPlanNewStateFAProblems);
  });
});
