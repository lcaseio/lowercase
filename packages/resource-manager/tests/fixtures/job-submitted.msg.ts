import type { JobEvent } from "@lcase/types";
import type { JobSubmittedMsg } from "../../src/rm.types.js";
import type { RmState } from "../../src/resource-manager.js";

const toolId = "httpjson";
const workerId = "test-workerid";
const runId = "test-runid";

export const jobSubmittedHttpJsonMsg = {
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
    runid: runId,
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

export const jobSubmittedStartState = {
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
        name: "worker-name",
        type: "internal",
        status: "online",
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
