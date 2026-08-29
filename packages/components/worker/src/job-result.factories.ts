import type {
  ArtifactRef,
  ExecuteJobCommand,
  JobExecutionError,
  JobResult,
} from "./job.contracts.js";

// Extracted out of worker.ts so worker-capacity.ts (which wraps Worker from
// the outside) can build a CANCELLED result without an awkward import
// direction back into the file it wraps.

export type StoredExecutionOutputs = {
  output: ArtifactRef;
  exports?: Record<string, ArtifactRef>;
};

export function cancelledResult(command: ExecuteJobCommand): JobResult {
  return {
    status: "failed",
    executionId: command.executionId,
    jobId: command.jobId,
    error: {
      code: "CANCELLED",
      message: "Job execution was cancelled",
      retryable: false,
    },
  };
}

export function failedResult(
  command: ExecuteJobCommand,
  error: JobExecutionError,
  output?: ArtifactRef,
): JobResult {
  return {
    status: "failed",
    executionId: command.executionId,
    jobId: command.jobId,
    error,
    ...(output ? { output } : {}),
  };
}

export function completedResult(
  command: ExecuteJobCommand,
  outputs: StoredExecutionOutputs,
): JobResult {
  return {
    status: "completed",
    executionId: command.executionId,
    jobId: command.jobId,
    ...outputs,
  };
}
