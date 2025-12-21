import { describe, expect, it } from "vitest";
import { jobFinishedReducer } from "../../src/reducers/job-finished.reducer.js";
import { jobFinishedFixture } from "../fixtures/job-finished.fixture.js";

describe("jobCompletedReducer", () => {
  it("updates job completed and decrements concurrency", () => {
    const { toolId, jobId, runId, newState } = jobFinishedFixture;

    const finalState = jobFinishedReducer(
      jobFinishedFixture.state.noDelayed,
      jobFinishedFixture.msg
    );
    expect(finalState).toEqual(newState.noDelayed);
  });

  it("updates job as completed and queues delayed job if possible", () => {
    const { toolId, delayedJobId, jobId, runId } = jobFinishedFixture;

    const expectedState = structuredClone(jobFinishedFixture.state.delayed);

    // delete old job state, add new in flight form delayed job
    delete expectedState.runtime.perTool[toolId].inFlight[jobId];
    delete expectedState.runtime.perRun[runId].jobTool[jobId];
    expectedState.runtime.perTool[toolId].inFlight[delayedJobId] = {
      runId,
      startedAt: "",
    };
    expectedState.runtime.perTool[toolId].queue.delayed.shift();
    expectedState.runtime.perTool[toolId].queue.ready.push(delayedJobId);

    delete expectedState.runtime.perRun[runId].delayedJobs[delayedJobId];
    expectedState.runtime.perRun[runId].jobTool[delayedJobId] = toolId;

    const newState = jobFinishedReducer(
      jobFinishedFixture.state.delayed,
      jobFinishedFixture.msg
    );
    expect(newState).toEqual(jobFinishedFixture.newState.delayed);
  });
});
