import type { JsonValue } from "@lcase/types";
import type {
  JobExecutionOutcome,
  JobExecutionRequest,
} from "@lcase/ports/engine";
import type { ExecuteJobCommand, JobResult } from "@lcase/worker";

// Pure translation between engine's own JobExecutorPort vocabulary (the real
// job.httpjson.submitted envelope shape, since Change C7) and worker's
// JobExecutionPort vocabulary (still its own nested ProtocolRequest shape).
// The one place both shapes are known at once -- LocalWorkerJobExecutor
// (same directory) is the only caller.

export function toExecuteJobCommand(
  request: JobExecutionRequest,
): ExecuteJobCommand {
  return {
    // No retry loop exists on this local path yet -- one dispatch is always
    // exactly one execution attempt, so reusing jobid here is a temporary
    // mapping, not a decision that executionId should permanently equal
    // jobId long-term (same call the related change compat mapper already made).
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
      // ShallowJsonValue -> JsonValue: correct by construction (a step's
      // body is only ever JSON.parse'd/authored JSON), but not structurally
      // assignable -- same precedent as the related change
      // materialize-http-json-request.ts and the related change compat mapper.
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
