import { describe, it, expect } from "vitest";
import { jobSubmittedReducer } from "../../src/reducers/job-submitted.reducer.js";
import { RmState } from "../../src/resource-manager.js";

import {
  jobSubmittedHttpJsonMsg,
  jobSubmittedStartState,
} from "../fixtures/job-submitted.msg.js";

describe("jobSubmittedReducer", () => {
  it("resolves the tool and queues the job when concurrency limits are not met", () => {
    const toolId = "httpjson";
    const runId = jobSubmittedHttpJsonMsg.event.runid;

    const result = jobSubmittedReducer(
      jobSubmittedStartState,
      jobSubmittedHttpJsonMsg
    );

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
    expect(result).toEqual(expectedState);
  });
});
