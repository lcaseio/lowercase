import { describe, expect, it } from "vitest";
import { jobFinishedReducer } from "../../src/reducers/job-finished.reducer.js";
import { jobFinishedFixture } from "../fixtures/job-finished.fixture.js";

describe("jobCompletedReducer", () => {
  it("updates job completed and decrements concurrency", () => {
    const { toolId, jobId, runId, newState } = jobFinishedFixture;

    const finalState = jobFinishedReducer(
      jobFinishedFixture.startState.noDelayed,
      jobFinishedFixture.msg
    );
    expect(finalState).toEqual(newState.noDelayed);
  });

  it("updates job as completed and queues delayed job if possible", () => {
    const finalState = jobFinishedReducer(
      jobFinishedFixture.startState.delayed,
      jobFinishedFixture.msg
    );
    expect(finalState).toEqual(jobFinishedFixture.newState.delayed);
  });
});
