import { describe, it, expect } from "vitest";
import { jobSubmittedPlanner } from "../../src/planners/job-submitted.planner.js";
import {
  jobSubmittedHttpJsonMsg,
  jobSubmittedStartState,
} from "../fixtures/job-submitted.msg.js";
import type { SchedulerState } from "../../src/scheduler.state.type.js";
import { QueueJobFx } from "../../src/scheduler.types.js";
describe("jobSubmittedPlanner", () => {
  it("should queue jobs when new job is added as ready", () => {
    const toolId = "httpjson";
    const workerId = "test-workerid";
    const runId = jobSubmittedHttpJsonMsg.event.runid;
    const jobId = "test-jobid";

    const expectedState = structuredClone(
      jobSubmittedStartState
    ) as SchedulerState;
    expectedState.runtime.perRun = {
      [runId]: {
        activeJobsPerToolCount: { httpjson: 1 },
        delayed: {},
        jobToolMap: { [jobId]: toolId },
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueued: {
          [jobId]: {
            capId: jobSubmittedHttpJsonMsg.event.capid,
            runId,
            jobId,
            toolId,
          },
        },
        pendingQueuedCount: 1,
        queued: {},
        running: {},
      },
    };
    expectedState.runtime.perTool = {
      [toolId]: {
        activeJobCount: 1,
        delayed: {},
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueued: {
          [jobId]: {
            capId: jobSubmittedHttpJsonMsg.event.capid,
            runId,
            jobId,
            toolId,
          },
        },
        pendingQueuedCount: 1,
        queued: {},
        running: {},
      },
    };

    const result = jobSubmittedPlanner(
      jobSubmittedStartState,
      expectedState,
      jobSubmittedHttpJsonMsg
    );

    const queueJobFx = {
      type: "QueueJob",
      toolId: "httpjson",
      event: jobSubmittedHttpJsonMsg.event,
    } satisfies QueueJobFx;

    expect(result).toEqual([queueJobFx]);
  });
});
