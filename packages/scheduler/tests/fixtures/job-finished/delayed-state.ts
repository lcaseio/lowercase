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
export const startStateDelayed: SchedulerState = {
  policy: basePolicy,
  registry: baseRegistry,
  runtime: {
    perTool: {
      [toolId]: {
        activeJobCount: 2,
        delayed: {
          delayedId: {
            jobId: "delayed-jobid",
            capId: "httpjson",
            runId: "delayed-runid",
            toolId: "delayed-toolid",
          },
        },
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueued: {},
        pendingQueuedCount: 0,
        queued: {},
        running: {
          [jobId]: {
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
    },
    perRun: {
      [runId]: {
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
    },
  },
};

export const endStateDelayed: SchedulerState = {
  policy: basePolicy,
  registry: baseRegistry,
  runtime: {
    perTool: {
      [toolId]: {
        activeJobCount: 2,
        delayed: {
          delayedId: {
            jobId: "delayed-jobid",
            capId: "httpjson",
            runId: "delayed-runid",
            toolId: "delayed-toolid",
          },
        },
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
      [runId]: {
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
