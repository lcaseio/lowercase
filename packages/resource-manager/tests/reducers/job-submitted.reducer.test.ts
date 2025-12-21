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
        delayedArray: [],
        jobToolMap: { [jobId]: toolId },
        pendingDelayed: {},
        pendingQueued: {
          [jobId]: {
            capId: jobSubmittedHttpJsonMsg.event.capid,
            runId,
            jobId,
            toolId,
          },
        },
        queued: {},
        queuedArray: [],
      },
    };
    expectedState.runtime.perTool = {
      [toolId]: {
        activeJobCount: 1,
        delayed: {},
        delayedArray: [],
        pendingDelayed: {},
        pendingQueued: {
          [jobId]: {
            capId: jobSubmittedHttpJsonMsg.event.capid,
            runId,
            jobId,
            toolId,
          },
        },
        queued: {},
        queuedArray: [],
        toBeDelayed: null,
        toBeQueued: jobId,
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
        delayedArray: [],
        jobToolMap: { [jobId]: toolId },
        pendingDelayed: {
          [jobId]: {
            capId: jobSubmittedHttpJsonMsg.event.capid,
            runId,
            jobId,
            toolId,
          },
        },
        pendingQueued: {},
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
        queuedArray: ["job1", "job2"],
      },
    };
    expectedState.runtime.perTool = {
      [toolId]: {
        activeJobCount: 2,
        delayed: {},
        delayedArray: [],
        pendingDelayed: {
          [jobId]: {
            capId: jobSubmittedHttpJsonMsg.event.capid,
            runId,
            jobId,
            toolId,
          },
        },
        pendingQueued: {},
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
        queuedArray: ["job1", "job2"],
        toBeDelayed: jobId,
        toBeQueued: null,
      },
    };
    expect(result).toEqual(expectedState);
  });
});
