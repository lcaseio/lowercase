import { describe, it, expect } from "vitest";
import { RmState } from "../../src/resource-manager";
import { JobQueuedMsg } from "../../src/rm.types";
import { jobQueuedReducer } from "../../src/reducers/job-queued.reducer.js";

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
            pendingDelayed: {},
            pendingDelayedCount: 0,
            pendingQueued: {
              [jobId]: {
                jobId,
                toolId,
                capId: "httpjson",
                runId,
              },
            },
            pendingQueuedCount: 1,
            queued: {},
          },
        },
        perRun: {
          [runId]: {
            jobToolMap: { [jobId]: toolId },
            activeJobsPerToolCount: { httpjson: 1 },
            delayed: {},
            pendingDelayed: {},
            pendingDelayedCount: 0,
            pendingQueued: {
              [jobId]: {
                jobId,
                toolId,
                capId: "httpjson",
                runId,
              },
            },
            pendingQueuedCount: 1,
            queued: {},
          },
        },
      },
    };

    const jobQueuedMsg: JobQueuedMsg = {
      type: "JobQueued",
      event: {
        type: "job.httpjson.queued",
        action: "queued",
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
      delayed: {},
      pendingDelayed: {},
      pendingDelayedCount: 0,
      pendingQueued: {},
      pendingQueuedCount: 0,
      queued: {
        [jobId]: {
          jobId,
          toolId,
          capId: "httpjson",
          runId,
        },
      },
    };
    expectedState.runtime.perTool[toolId] = {
      activeJobCount: 1,
      delayed: {},
      pendingDelayed: {},
      pendingDelayedCount: 0,
      pendingQueued: {},
      pendingQueuedCount: 0,
      queued: {
        [jobId]: {
          jobId,
          toolId,
          capId: "httpjson",
          runId,
        },
      },
    };

    const newState = jobQueuedReducer(startState, jobQueuedMsg);
    expect(newState).toEqual(expectedState);
  });
});
