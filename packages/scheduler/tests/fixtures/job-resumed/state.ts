import { SchedulerState } from "../../../src/scheduler.state.type.js";
const jobId = "test-jobid";
const toolId = "httpjson";
const runId = "test-runid";
const workerId = "test-workerid";
export const jobResumedStartState: SchedulerState = {
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
        activeJobCount: 2,
        delayed: {
          [jobId]: {
            jobId,
            capId: "httpjson",
            runId: "test-runid",
            toolId,
          },
        },
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueued: {},
        pendingQueuedCount: 0,
        queued: {},
        running: {},
      },
    },
    perRun: {
      [runId]: {
        delayed: {
          [jobId]: {
            jobId,
            capId: "httpjson",
            runId: "test-runid",
            toolId,
          },
        },
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueued: {},
        pendingQueuedCount: 0,
        queued: {},
        running: {},
        activeJobsPerToolCount: {},
        jobToolMap: { [jobId]: "httpjson" },
      },
    },
  },
};

export const jobResumedEndState: SchedulerState = {
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
        activeJobCount: 2,
        delayed: {},
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueued: {
          [jobId]: {
            jobId,
            capId: "httpjson",
            runId: "test-runid",
            toolId,
          },
        },
        pendingQueuedCount: 1,
        queued: {},
        running: {},
      },
    },
    perRun: {
      [runId]: {
        delayed: {},
        pendingDelayed: {},
        pendingDelayedCount: 0,
        pendingQueued: {
          [jobId]: {
            jobId,
            capId: "httpjson",
            runId: "test-runid",
            toolId,
          },
        },
        pendingQueuedCount: 1,
        queued: {},
        running: {},
        activeJobsPerToolCount: { [toolId]: 1 },
        jobToolMap: { [jobId]: "httpjson" },
      },
    },
  },
};
