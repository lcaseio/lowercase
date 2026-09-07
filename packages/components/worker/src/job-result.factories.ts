import type {
  ArtifactRef,
  ExecuteJobCommand,
  JobExecutionError,
  JobResult,
} from "./job.contracts.js";

// Worker's terminal result construction, kept beside the command contracts
// rather than inside worker.ts: JobRunner reports a modelled outcome and
// Worker turns it into one of these, so the mapping from outcome to result is
// worth reading in one place.

export type StoredExecutionOutputs = {
  output: ArtifactRef;
  exports?: Record<string, ArtifactRef>;
};

export function cancelledResult(command: ExecuteJobCommand): JobResult {
  return {
    status: "failed",
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
    jobId: command.jobId,
    ...outputs,
  };
}
