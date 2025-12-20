import { describe, it, expect } from "vitest";
import { jobSubmittedPlanner } from "../../src/planners/job-submitted.planner.js";
import {
  jobSubmittedHttpJsonMsg,
  jobSubmittedStartState,
} from "../fixtures/job-submitted.msg.js";
import { RmState } from "../../src/resource-manager.js";
import { QueueJobFx } from "../../src/rm.types.js";
describe("jobSubmittedPlanner", () => {
  it("should queue jobs when new job is added as ready", () => {
    const toolId = "httpjson";
    const workerId = "test-workerid";
    const runId = jobSubmittedHttpJsonMsg.event.runid;

    const expectedState = structuredClone(jobSubmittedStartState) as RmState;
    expectedState.runtime.perRun = {
      [runId]: {
        activeToolCount: {
          httpjson: 1,
        },
        delayedJobs: {},
        jobTool: {
          ["test-jobid"]: toolId,
        },
      },
    };
    expectedState.runtime.perTool = {
      [toolId]: {
        activeJobCount: 1,
        inFlight: {
          "test-jobid": {
            runId,
            startedAt: "test-time",
          },
        },
        queue: {
          delayed: [],
          ready: ["test-jobid"],
        },
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
