import { describe, it, expect } from "vitest";
import { jobDequeuedReducer } from "../../src/reducers/job-dequeued.reducer";
import {
  jobDequeuedStartState,
  jobDequeuedEndState,
} from "../fixtures/job-dequeued/state.js";
import { jobDequeuedMsg } from "../fixtures/job-dequeued/message.js";

describe("jobDequeuedReducer", () => {
  it("moves queued jobs to running", () => {
    const finalState = jobDequeuedReducer(
      jobDequeuedStartState,
      jobDequeuedMsg
    );
    expect(finalState).toEqual(jobDequeuedEndState);
  });
});
