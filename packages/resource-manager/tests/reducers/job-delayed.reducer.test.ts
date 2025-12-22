import { describe, it, expect } from "vitest";
import { RmState } from "../../src/resource-manager";
import { JobDelayedMsg, JobQueuedMsg } from "../../src/rm.types";
import { jobDelayedReducer } from "../../src/reducers/job-delayed.reducer.js";

describe("jobQueuedReducer", () => {
  it("moves from pendingQueued to queued", () => {
    const jobId = "test-jobid";
    const toolId = "test-toolid";
    const runId = "test-runid";

    const startState: RmState = {
      policy: {
        defaultToolMap: {
          httpjson: "httpjson",
          mcp: "mcp",
        },
      },
      registry: {
        tools: {},
        workers: {},
      },
      runtime: {
        perTool: {
          [toolId]: {
            activeJobCount: 1,
            delayed: {},
            pendingDelayed: {
              [jobId]: {
                jobId,
                toolId,
                capId: "httpjson",
                runId,
              },
            },
            pendingDelayedCount: 1,
            pendingQueued: {},
            pendingQueuedCount: 0,
            queued: {},
          },
        },
        perRun: {
          [runId]: {
            jobToolMap: { [jobId]: toolId },
            activeJobsPerToolCount: { httpjson: 1 },
            delayed: {},
            pendingDelayed: {
              [jobId]: {
                jobId,
                toolId,
                capId: "httpjson",
                runId,
              },
            },
            pendingDelayedCount: 1,
            pendingQueued: {},
            pendingQueuedCount: 0,
            queued: {},
          },
        },
      },
    };

    const jobDelayedMsg: JobDelayedMsg = {
      type: "JobDelayed",
      event: {
        type: "job.httpjson.delayed",
        action: "delayed",
        capid: "httpjson",
        data: {
          url: "",
          job: {
            id: jobId,
            capid: "httpjson",
            toolid: toolId,
          },
        },
        domain: "job",
        flowid: "test-flowid",
        id: "test-eventid",
        jobid: jobId,
        runid: runId,
        source: "lowercase://rm",
        spanid: "test-spanid",
        specversion: "1.0",
        stepid: "test-stepid",
        time: "test-time",
        toolid: toolId,
        traceid: "test-traceid",
        traceparent: "test-traceparent",
      },
    };

    const expectedState = structuredClone(startState);
    expectedState.runtime.perRun[runId] = {
      jobToolMap: { [jobId]: toolId },
      activeJobsPerToolCount: { httpjson: 1 },
      delayed: {
        [jobId]: {
          jobId,
          toolId,
          capId: "httpjson",
          runId,
        },
      },
      pendingDelayed: {},
      pendingDelayedCount: 0,
      pendingQueued: {},
      pendingQueuedCount: 0,
      queued: {},
    };
    expectedState.runtime.perTool[toolId] = {
      activeJobCount: 1,
      delayed: {
        [jobId]: {
          jobId,
          toolId,
          capId: "httpjson",
          runId,
        },
      },
      pendingDelayed: {},
      pendingDelayedCount: 0,
      pendingQueued: {},
      pendingQueuedCount: 0,
      queued: {},
    };

    const newState = jobDelayedReducer(startState, jobDelayedMsg);
    expect(newState).toEqual(expectedState);
  });
});
