import { describe, it, expect } from "vitest";
import { jobSubmittedReducer } from "../../src/reducers/job-submitted.reducer.js";
import { RmState } from "../../src/resource-manager.js";
import { JobSubmittedMsg } from "../../src/rm.types.js";
import { JobEvent } from "@lcase/types";

describe("jobSubmittedReducer", () => {
  it("works", () => {
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

    const message = {
      type: "JobSubmitted",
      event: {
        type: "job.httpjson.submitted",
        capid: "httpjson",
        action: "submitted",

        data: {
          url: "test-url",
          job: {
            id: "test-jobid",
            capid: "httpjson",
            toolid: null,
          },
        },
        domain: "job",
        flowid: "test-flowid",
        id: "test-id",
        jobid: "test-jobid",
        runid: "test-runid",
        source: "test-source",
        spanid: "test-span",
        specversion: "1.0",
        stepid: "test-stepid",
        time: "test-time",
        toolid: null,
        traceid: "test-traceid",
        traceparent: "test-traceparent",
      } satisfies JobEvent<"job.httpjson.submitted">,
    } satisfies JobSubmittedMsg;
    const result = jobSubmittedReducer(state, message);

    const expectedState = structuredClone(state) as RmState;

    expectedState.runtime.perRun = {
      [runId]: {
        activeJobsByToolIdCount: {
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
