import type { RmState } from "../../../src/rm.state.type.js";

const jobId = "test-jobid";
const toolId = "test-toolid";
const runId = "test-runid";
const workerId = "test-workerid";
const delayedJobId = "delayed-jobid";

const basePolicy: RmState["policy"] = {
  defaultToolMap: {
    httpjson: "httpjson",
    mcp: "mcp",
  },
};
const baseRegistry: RmState["registry"] = {
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
};

export const startState: RmState = {
  policy: basePolicy,
  registry: baseRegistry,
  runtime: {
    perTool: {
      [toolId]: {
        activeJobCount: 2,
        delayed: {},
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueued: {},
        pendingQueuedCount: 0,
        queued: {},
        running: {
          [jobId]: {
            jobId: jobId,
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
    },
    perRun: {
      "test-runid": {
        activeJobsPerToolCount: { [toolId]: 2 },
        delayed: {},
        jobToolMap: { [jobId]: toolId },
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueuedCount: 0,
        pendingQueued: {},
        queued: {},
        running: {
          [jobId]: {
            jobId: jobId,
            toolId: toolId,
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
    },
  },
};
export const endState: RmState = {
  policy: basePolicy,
  registry: baseRegistry,
  runtime: {
    perTool: {
      [toolId]: {
        activeJobCount: 1,
        delayed: {},
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueued: {},
        pendingQueuedCount: 0,
        queued: {},
        running: {
          job2: {
            jobId: "",
            toolId: "",
            runId: "",
            capId: "httpjson",
          },
        },
      },
    },
    perRun: {
      "test-runid": {
        activeJobsPerToolCount: { [toolId]: 1 },
        delayed: {},
        jobToolMap: {},
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueuedCount: 0,
        pendingQueued: {},
        queued: {},
        running: {
          job2: {
            jobId: "",
            toolId: "",
            runId: "",
            capId: "httpjson",
          },
        },
      },
    },
  },
};
