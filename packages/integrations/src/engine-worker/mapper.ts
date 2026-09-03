import type {
  JobExecutionOutcome,
  JobExecutionRequest,
} from "@lcase/ports/engine";
import type { ExecuteJobCommand, JobResult } from "@lcase/worker";

// Pure translation between engine's own JobExecutorPort vocabulary and
// worker's JobExecutionPort vocabulary. The one place both shapes are known
// at once -- LocalWorkerJobExecutor (same directory) is the only caller.

export function toExecuteJobCommand(
  request: JobExecutionRequest,
): ExecuteJobCommand {
  return {
    // No retry loop exists on this local path yet -- one dispatch is always
    // exactly one execution attempt, so reusing jobId here is a temporary
    // mapping, not a decision that executionId should permanently equal
    // jobId long-term (same call the related change compat mapper already made).
    executionId: request.jobId,
    jobId: request.jobId,
    runId: request.runId,
    stepId: request.stepId,
    traceId: request.traceId,
    protocol: request.protocol,
    refs: request.refs,
    exports: request.exports,
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
