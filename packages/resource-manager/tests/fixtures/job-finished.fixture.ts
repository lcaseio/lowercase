import { RmState } from "../../src/resource-manager";
import { JobFinishedMsg } from "../../src/rm.types";
const jobId = "test-jobid";
const toolId = "test-toolid";
const runId = "test-runid";
const workerId = "test-workerid";
const delayedJobId = "delayed-jobid";

export const jobFinishedMsg = {
  type: "JobFinished",
  event: {
    action: "completed",
    capid: "httpjson",
    data: {
      job: {
        id: jobId,
        capid: "httpjson",
        toolid: toolId,
      },
      status: "success",
      result: {},
    },
    domain: "job",
    flowid: "test-flowid",
    id: "test-id",
    jobid: jobId,
    runid: runId,
    source: "test-source",
    spanid: "test-spanid",
    specversion: "1.0",
    stepid: "test-stepid",
    time: "test-time",
    toolid: "test-toolid",
    traceid: "test-traceid",
    traceparent: "test-traceparent",
    type: "job.httpjson.completed",
  },
} satisfies JobFinishedMsg;

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

const startState: RmState = {
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

const newState = {
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

const startStateDelayed: RmState = {
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

const newStateDelayed: RmState = {
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

export const jobFinishedFixture = {
  msg: jobFinishedMsg,
  jobId,
  toolId,
  runId,
  workerId,
  delayedJobId,
  startState: {
    noDelayed: startState,
    delayed: startStateDelayed,
  },
  newState: {
    noDelayed: newState,
    delayed: newStateDelayed,
  },
};
