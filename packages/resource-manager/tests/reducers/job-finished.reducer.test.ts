import { describe, expect, it } from "vitest";
import { jobFinishedReducer } from "../../src/reducers/job-finished.reducer.js";
import { jobFinishedMsg } from "../fixtures/job-finished/message.js";
import { startState, endState } from "../fixtures/job-finished/state.js";
import {
  startStateDelayed,
  endStateDelayed,
} from "../fixtures/job-finished/delayed-state.js";

describe("jobCompletedReducer", () => {
  it("updates job completed and decrements concurrency", () => {
    const finalState = jobFinishedReducer(startState, jobFinishedMsg);
    expect(finalState).toEqual(endState);
  });

  it("updates job as completed and queues delayed job if possible", () => {
    const finalState = jobFinishedReducer(startStateDelayed, jobFinishedMsg);
    expect(finalState).toEqual(endStateDelayed);
  });
});
