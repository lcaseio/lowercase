import { AnyEvent } from "@lcase/types";

export const stepStartedEvent = {
  data: {
    step: {
      id: "test-stepid",
      name: "test-stepid",
      type: "httpjson",
    },
    status: "started",
  },
  id: "test-id",
  source: "test-source",
  specversion: "1.0",
  time: "test-time",
  type: "step.started",
  domain: "step",
  action: "started",
  traceparent: "test-traceparent",
  traceid: "test-traceid",
  spanid: "test-spanid",
  flowid: "test-flowid",
  runid: "test-runid",
  stepid: "test-stepid",
  steptype: "httpjson",
} satisfies AnyEvent<"step.started">;
