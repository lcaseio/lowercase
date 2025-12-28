import { describe, it, expect } from "vitest";
import { jobResumedReducer } from "../../src/reducers/job-resumed.reducer";
import { jobResumedMsg } from "../fixtures/job-resumed/message.js";
import {
  jobResumedStartState,
  jobResumedEndState,
} from "../fixtures/job-resumed/state.js";
describe("jobResumedReducer", () => {
  it("moves delayed jobs to pending queued", () => {
    const finalState = jobResumedReducer(jobResumedStartState, jobResumedMsg);
    expect(finalState).toEqual(jobResumedEndState);
  });
});
