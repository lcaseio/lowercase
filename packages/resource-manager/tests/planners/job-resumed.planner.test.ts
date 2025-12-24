import { describe, expect, it } from "vitest";
import { jobResumedMsg } from "../fixtures/job-resumed/message.js";
import {
  jobResumedStartState,
  jobResumedEndState,
} from "../fixtures/job-resumed/state.js";
import { jobResumedPlanner } from "../../src/planners/job-resumed.planner.js";
import { QueueJobFx } from "../../src/rm.types.js";
describe("jobResumedPlanner", () => {
  it("produces expected queue job effect plans", () => {
    const effects = jobResumedPlanner(
      jobResumedStartState,
      jobResumedEndState,
      jobResumedMsg
    );
    const expectedEffects: QueueJobFx[] = [
      {
        type: "QueueJob",
        toolId: jobResumedMsg.event.data.job.toolid,
        event: jobResumedMsg.event,
      },
    ];
    expect(effects).toEqual(expectedEffects);
  });
});
