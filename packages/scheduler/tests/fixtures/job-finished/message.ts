import { JobFinishedMsg } from "../../../src/rm.types.js";
const jobId = "test-jobid";
const toolId = "test-toolid";
const runId = "test-runid";
const workerId = "test-workerid";
const delayedJobId = "delayed-jobid";

export const jobFinishedMsg: JobFinishedMsg = {
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
};
