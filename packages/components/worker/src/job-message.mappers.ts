import type { JobExecutionOutcome, JobExecutionRequest } from "@lcase/ports";
import type { JsonValue } from "@lcase/types";
import type { ExecuteJobCommand, JobResult } from "./job.contracts.js";

// Worker's own boundary translation: between the shared message contract
// (JobExecutionPort's JobExecutionRequest -- the real job.httpjson.submitted
// envelope) and worker's internal command vocabulary. Lives here, inside
// worker, rather than in a bridge package that knows both components --
// worker is the one that has to understand this message, so worker owns
// reading it. Identical work regardless of how the message arrived, which is
// the point: a direct in-process call and a message read off a log both land
// on exactly this translation.

export function toExecuteJobCommand(
  request: JobExecutionRequest,
): ExecuteJobCommand {
  return {
    // No retry loop exists on this path yet -- one dispatch is always exactly
    // one execution attempt, so reusing jobid here is a temporary mapping,
    // not a decision that executionId should permanently equal jobId.
    executionId: request.jobid,
    jobId: request.jobid,
    runId: request.runid,
    stepId: request.stepid,
    traceId: request.traceId,
    protocol: {
      kind: "httpjson",
      url: request.url,
      ...(request.method ? { method: request.method } : {}),
      ...(request.headers ? { headers: request.headers } : {}),
      // ShallowJsonValue -> JsonValue: correct by construction (a step's body
      // is only ever JSON.parse'd/authored JSON), but not structurally
      // assignable -- same precedent as materialize-http-json-request.ts.
      ...(request.body !== undefined
        ? { body: request.body as JsonValue }
        : {}),
    },
    refs: request.refs,
    exports: request.exportRefs,
  };
}

export function toJobExecutionOutcome(result: JobResult): JobExecutionOutcome {
  if (result.status === "completed") {
    return {
      status: "completed",
      output: result.output,
      exports: result.exports,
    };
  }
  return {
    status: "failed",
    error: result.error,
    output: result.output,
  };
}
