import { JobDequeuedMsg } from "../../../src/rm.types.js";
const jobId = "test-jobid";
const toolId = "httpjson";
const runId = "test-runid";
const workerId = "test-workerid";
export const jobDequeuedMsg: JobDequeuedMsg = {
  type: "JobDequeued",
  event: {
    type: "worker.job.dequeued",
    action: "dequeued",
    data: {
      capId: "httpjson",
      eventId: "test-eventid",
      eventType: "job.httpjson.queued",
      flowId: "test-flowid",
      jobId,
      runId,
      spanId: "test-spanid",
      stepId: "test-stepid",
      toolId,
    },
    domain: "worker",
    id: "test-id",
    source: "test-source",
    spanid: "test-span",
    specversion: "1.0",
    time: "test-time",
    traceid: "test-traceid",
    traceparent: "test-traceparent",
    workerid: workerId,
  },
};
