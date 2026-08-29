import type { AnyEvent } from "@lcase/types";
import type { ExecuteJobCommand } from "../../src/job.contracts.js";

export function makeCommand(
  overrides?: Partial<ExecuteJobCommand>,
): ExecuteJobCommand {
  return {
    executionId: "exec-1",
    jobId: "job-1",
    runId: "run-1",
    stepId: "step-1",
    protocol: { kind: "httpjson", url: "https://example.test/resource" },
    refs: [],
    ...overrides,
  };
}

// Not run through the real event-schema registry -- this is just a
// TS-shaped input value fed to pure mapper functions and a fake queue, not
// something asserted to be a genuinely valid AnyEvent by any validator.
export function makeQueuedEvent(
  overrides?: Partial<AnyEvent<"job.httpjson.queued">["data"]>,
): AnyEvent<"job.httpjson.queued"> {
  return {
    id: "event-1",
    source: "lowercase://router",
    specversion: "1.0",
    time: "2026-08-28T00:00:00.000Z",
    type: "job.httpjson.queued",
    domain: "job",
    entity: "httpjson",
    action: "queued",
    traceparent: "00-trace-span-01",
    traceid: "trace-1",
    spanid: "span-1",
    flowid: "flow-1",
    flowversionid: "flow-version-1",
    runid: "run-1",
    stepid: "step-1",
    jobid: "job-1",
    capid: "httpjson",
    toolid: "httpjson",
    data: {
      url: "https://example.test/resource",
      refs: [],
      ...overrides,
    },
  };
}
