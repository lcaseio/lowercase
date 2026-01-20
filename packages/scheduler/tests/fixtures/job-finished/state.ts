import type { SchedulerState } from "../../../src/scheduler.state.type.js";

const jobId = "test-jobid";
const toolId = "test-toolid";
const runId = "test-runid";
const workerId = "test-workerid";
const delayedJobId = "delayed-jobid";

const basePolicy: SchedulerState["policy"] = {
  defaultToolMap: {
    httpjson: "httpjson",
    mcp: "mcp",
  },
};
const baseRegistry: SchedulerState["registry"] = {
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

export const startState: SchedulerState = {
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
export const endState: SchedulerState = {
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
