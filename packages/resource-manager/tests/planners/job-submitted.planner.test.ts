import { describe, it, expect } from "vitest";
import { jobSubmittedPlanner } from "../../src/planners/job-submitted.planner.js";
import { jobSubmittedHttpJsonMsg } from "../fixtures/job-submitted.msg.js";
import { RmState } from "../../src/resource-manager.js";
import { QueueJobFx } from "../../src/rm.types.js";
describe("jobSubmittedPlanner", () => {
  it("should queue jobs when new job is added as ready", () => {
    const toolId = "httpjson";
    const workerId = "test-workerid";
    const runId = "test-runid";
    const state = {
      policy: {
        defaultToolMap: {
          httpjson: "httpjson",
          mcp: "mcp",
        },
      },
      registry: {
        tools: {
          [toolId]: {
            id: toolId,
            capabilities: ["httpjson"],
            hasOnlineWorker: true,
            location: "internal",
            maxConcurrency: 2,
          },
        },
        workers: {
          [workerId]: {
            canRunTools: {
              [toolId]: true,
            },
          },
        },
      },
      runtime: {
        perTool: {
          [toolId]: {
            activeJobCount: 0,
            inFlight: {},
            queue: {
              ready: [],
              delayed: [],
            },
          },
        },
        perRun: {},
      },
    } satisfies RmState;

    const expectedState = structuredClone(state) as RmState;
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
      state,
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
