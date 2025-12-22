import { describe, it, expect } from "vitest";
import { jobSubmittedReducer } from "../../src/reducers/job-submitted.reducer.js";
import { RmState } from "../../src/resource-manager.js";

import {
  jobSubmittedHttpJsonMsg,
  jobSubmittedStartState,
  startStateFilledConcurrency,
} from "../fixtures/job-submitted.msg.js";

describe("jobSubmittedReducer", () => {
  it("resolves the tool and queues the job when concurrency limits are not met", () => {
    const toolId = "httpjson";
    const runId = jobSubmittedHttpJsonMsg.event.runid;
    const jobId = "test-jobid";

    const result = jobSubmittedReducer(
      jobSubmittedStartState,
      jobSubmittedHttpJsonMsg
    );

    const expectedState = structuredClone(jobSubmittedStartState) as RmState;

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
      },
    };
    expect(result).toEqual(expectedState);
  });
  it("resolves the tool and queues the job when concurrency limits are exceeded", () => {
    const toolId = "httpjson";
    const runId = jobSubmittedHttpJsonMsg.event.runid;
    const jobId = "test-jobid";

    const result = jobSubmittedReducer(
      startStateFilledConcurrency,
      jobSubmittedHttpJsonMsg
    );

    const expectedState = structuredClone(
      startStateFilledConcurrency
    ) as RmState;

    expectedState.runtime.perRun = {
      [runId]: {
        activeJobsPerToolCount: { httpjson: 2 },
        delayed: {},
        jobToolMap: { [jobId]: toolId },
        pendingDelayed: {
          [jobId]: {
            capId: jobSubmittedHttpJsonMsg.event.capid,
            runId,
            jobId,
            toolId,
          },
        },
        pendingDelayedCount: 1,
        pendingQueued: {},
        pendingQueuedCount: 0,
        queued: {
          job1: {
            jobId: "",
            toolId: "",
            runId: "",
            capId: "httpjson",
          },
          job2: {
            jobId: "",
            toolId: "",
            runId: "",
            capId: "httpjson",
          },
        },
      },
    };
    expectedState.runtime.perTool = {
      [toolId]: {
        activeJobCount: 2,
        delayed: {},
        pendingDelayed: {
          [jobId]: {
            capId: jobSubmittedHttpJsonMsg.event.capid,
            runId,
            jobId,
            toolId,
          },
        },
        pendingDelayedCount: 1,
        pendingQueued: {},
        pendingQueuedCount: 0,
        queued: {
          job1: {
            jobId: "",
            toolId: "",
            runId: "",
            capId: "httpjson",
          },
          job2: {
            jobId: "",
            toolId: "",
            runId: "",
            capId: "httpjson",
          },
        },
      },
    };
    expect(result).toEqual(expectedState);
  });
});
