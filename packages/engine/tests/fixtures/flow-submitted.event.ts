import { AnyEvent } from "@lcase/types";

export const flowSubmittedEvent = {
  id: "test-id",
  source: "test-source",
  specversion: "1.0",
  time: "test-time",
  type: "flow.submitted",
  data: {
    inputs: {},
    run: { id: "test-runid" },
    flow: {
      id: "test-flowid",
      name: "test-flowname",
      version: "test-flowversion",
    },
    definition: {
      name: "test-flowname",
      version: "test-flowversion",
      description: "test-flowdescription",
      inputs: {},
      outputs: {},
      start: "start",
      steps: {
        start: {
          type: "httpjson",
          url: "test-url",
        },
      },
    },
  },
  domain: "flow",
  action: "submitted",
  traceparent: "",
  traceid: "test-traceid",
  spanid: "test-spanid",
  flowid: "test-flowid",
  runid: "test-runid",
} satisfies AnyEvent<"flow.submitted">;
