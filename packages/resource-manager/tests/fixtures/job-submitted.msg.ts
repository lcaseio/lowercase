import { JobEvent } from "@lcase/types";
import { JobSubmittedMsg } from "../../src/rm.types";

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
    runid: "test-runid",
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
