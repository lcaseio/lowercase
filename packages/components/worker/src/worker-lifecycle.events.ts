import type {
  ArtifactRef,
  ExecuteJobCommand,
  JobExecutionError,
} from "./job.contracts.js";

// Deliberately keyed on `kind`, not `type` -- this is not an `AnyEvent` and
// must not read as bus-compatible. Recorded directly via
// `WorkerLifecycleEventSink.record()`, never published on the bus.
export type WorkerLifecycleEventBase = {
  executionId: string;
  jobId: string;
  runId: string;
  stepId: string;
  traceId?: string;
  time: string;
};

export type WorkerLifecycleEvent =
  | (WorkerLifecycleEventBase & { kind: "job-execution-started" })
  | (WorkerLifecycleEventBase & {
      kind: "job-execution-completed";
      output: ArtifactRef;
      exports?: Record<string, ArtifactRef>;
    })
  | (WorkerLifecycleEventBase & {
      kind: "job-execution-failed";
      error: JobExecutionError;
    })
  | (WorkerLifecycleEventBase & { kind: "job-execution-cancelled" });

function baseFrom(command: ExecuteJobCommand): WorkerLifecycleEventBase {
  return {
    executionId: command.executionId,
    jobId: command.jobId,
    runId: command.runId,
    stepId: command.stepId,
    traceId: command.traceId,
    time: new Date().toISOString(),
  };
}

export function makeJobExecutionStartedEvent(
  command: ExecuteJobCommand,
): WorkerLifecycleEvent {
  return { ...baseFrom(command), kind: "job-execution-started" };
}

export function makeJobExecutionCompletedEvent(
  command: ExecuteJobCommand,
  output: ArtifactRef,
  exports?: Record<string, ArtifactRef>,
): WorkerLifecycleEvent {
  return {
    ...baseFrom(command),
    kind: "job-execution-completed",
    output,
    exports,
  };
}

export function makeJobExecutionFailedEvent(
  command: ExecuteJobCommand,
  error: JobExecutionError,
): WorkerLifecycleEvent {
  return { ...baseFrom(command), kind: "job-execution-failed", error };
}

export function makeJobExecutionCancelledEvent(
  command: ExecuteJobCommand,
): WorkerLifecycleEvent {
  return { ...baseFrom(command), kind: "job-execution-cancelled" };
}
