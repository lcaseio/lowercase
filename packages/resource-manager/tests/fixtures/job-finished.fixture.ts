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
        activeJobCount: 1,
        inFlight: {
          [jobId]: {
            runId,
            startedAt: "test-startedAt",
          },
        },
        queue: {
          ready: [],
          delayed: [],
        },
      },
    },
    perRun: {
      [runId]: {
        jobTool: { [jobId]: toolId },
        activeToolCount: { [toolId]: 1 },
        delayedJobs: {},
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
        activeJobCount: 0,
        inFlight: {},
        queue: {
          ready: [],
          delayed: [],
        },
      },
    },
    perRun: {
      [runId]: {
        jobTool: {},
        activeToolCount: { [toolId]: 0 },
        delayedJobs: {},
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
        activeJobCount: 1,
        inFlight: {
          [jobId]: {
            runId,
            startedAt: "test-startedAt",
          },
        },
        queue: {
          ready: [],
          delayed: [{ jobId: delayedJobId, runId }],
        },
      },
    },
    perRun: {
      [runId]: {
        jobTool: { [jobId]: toolId },
        activeToolCount: { [toolId]: 1 },
        delayedJobs: {
          [delayedJobId]: {
            toolId,
            reason: "test-reason",
            since: "test-since",
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
        activeJobCount: 1,
        inFlight: { [delayedJobId]: { runId, startedAt: "" } },
        queue: {
          ready: [delayedJobId],
          delayed: [],
        },
      },
    },
    perRun: {
      [runId]: {
        jobTool: { [delayedJobId]: toolId },
        activeToolCount: { [toolId]: 1 },
        delayedJobs: {},
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
  state: {
    noDelayed: startState,
    delayed: startStateDelayed,
  },
  newState: {
    noDelayed: newState,
    delayed: newStateDelayed,
  },
};
