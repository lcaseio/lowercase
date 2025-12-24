import { JobResumedMsg } from "../../../src/rm.types";

export const jobResumedMsg: JobResumedMsg = {
  type: "JobResumed",
  event: {
    type: "job.httpjson.resumed",
    capid: "httpjson",
    action: "resumed",
    data: {
      url: "test-url",
      job: {
        id: "test-jobid",
        capid: "httpjson",
        toolid: "httpjson",
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
    toolid: "httpjson",
    traceid: "test-traceid",
    traceparent: "test-traceparent",
  },
};
