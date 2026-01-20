import { describe, it, expect } from "vitest";
import { jobSubmittedReducer } from "../../src/reducers/job-submitted.reducer.js";
import type { SchedulerState } from "../../src/scheduler.state.type.js";

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
    ) as SchedulerState;

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
        running: {},
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
        running: {},
      },
    };
    expect(result).toEqual(expectedState);
  });
});
