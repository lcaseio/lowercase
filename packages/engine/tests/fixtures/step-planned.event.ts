import { AnyEvent } from "@lcase/types";

export const stepPlannedEvent: AnyEvent<"step.planned"> = {
  data: {
    step: {
      id: "test-stepid",
      name: "test-stepid",
      type: "httpjson",
    },
  },
  id: "test-id",
  source: "test-source",
  specversion: "1.0",
  time: "test-time",
  type: "step.planned",
  domain: "step",
  action: "planned",
  traceparent: "test-traceparent",
  traceid: "test-traceid",
  spanid: "test-spanid",
  flowid: "test-flowid",
  runid: "test-runid",
  stepid: "test-stepid",
  steptype: "httpjson",
};
