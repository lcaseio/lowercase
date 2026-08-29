import { createSemaphore } from "./concurrency/semaphore.js";
import { cancelledResult } from "./job-result.factories.js";
import type {
  ExecuteJobCommand,
  JobExecutionOptions,
  JobResult,
} from "./job.contracts.js";
import type { JobExecutionPort } from "./ports/inbound/job-execution.port.js";

export type WorkerCapacityConfig = {
  maxConcurrentJobs: number;
};

// Permit/capacity activity is telemetry, not a durable lifecycle fact --
// matches the existing worker.job.dequeued precedent (Telemetry, owned by
// the queue-consumer layer, not worker core). All hooks optional.
export type WorkerCapacityTelemetry = {
  onWaitStart?(command: ExecuteJobCommand): void;
  onGranted?(command: ExecuteJobCommand): void;
  onCancelled?(command: ExecuteJobCommand): void;
  onReleased?(command: ExecuteJobCommand): void;
};

// A decorator, not internal Worker state -- keeps the core focused on
// running one job, with capacity as a separate, composable concern wrapped
// around it.
export function withWorkerCapacity(
  core: JobExecutionPort,
  config: WorkerCapacityConfig,
  telemetry?: WorkerCapacityTelemetry,
): JobExecutionPort {
  const semaphore = createSemaphore(config.maxConcurrentJobs);

  return {
    async execute(
      command: ExecuteJobCommand,
      options?: JobExecutionOptions,
    ): Promise<JobResult> {
      const signal = options?.signal;
      if (signal?.aborted) {
        return cancelledResult(command);
      }

      telemetry?.onWaitStart?.(command);
      const outcome = await semaphore.acquire(signal);
      if (outcome.kind === "cancelled") {
        telemetry?.onCancelled?.(command);
        // No lifecycle facts recorded -- execution never reached "started".
        return cancelledResult(command);
      }
      telemetry?.onGranted?.(command);

      try {
        return await core.execute(command, options);
      } finally {
        outcome.release();
        telemetry?.onReleased?.(command);
      }
    },
  };
}
