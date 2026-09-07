import { createSemaphore, type Semaphore } from "./concurrency/semaphore.js";
import type { ExecuteJobCommand } from "./job.contracts.js";

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

export type CapacityAcquisition =
  { kind: "granted"; release(): void } | { kind: "cancelled" };

// Worker's component-wide active-job bound, owned by Worker rather than
// wrapped around it. The invariant has to stay Worker's regardless of how
// work arrives: a carrier's own in-flight limit bounds what that carrier
// presents, which stops being the same gate the moment a second subscription
// binds to the same Worker or a log-backed host reads in batches.
export class WorkerCapacity {
  readonly #semaphore: Semaphore;
  readonly #telemetry: WorkerCapacityTelemetry | undefined;

  constructor(
    config: WorkerCapacityConfig,
    telemetry?: WorkerCapacityTelemetry,
  ) {
    this.#semaphore = createSemaphore(config.maxConcurrentJobs);
    this.#telemetry = telemetry;
  }

  get available(): number {
    return this.#semaphore.available;
  }

  async acquire(
    command: ExecuteJobCommand,
    callerSignal?: AbortSignal,
  ): Promise<CapacityAcquisition> {
    // An already-abandoned job never joins the queue, so it produces no wait
    // or cancellation telemetry -- there was nothing to wait for or cancel.
    if (callerSignal?.aborted) {
      return { kind: "cancelled" };
    }

    this.#telemetry?.onWaitStart?.(command);
    const outcome = await this.#semaphore.acquire(callerSignal);
    if (outcome.kind === "cancelled") {
      this.#telemetry?.onCancelled?.(command);
      return { kind: "cancelled" };
    }
    this.#telemetry?.onGranted?.(command);

    // Handing `release` out makes double-release expressible in a way the
    // previous decorator's internal `finally` did not, so guard it here
    // rather than trusting every future call site not to inflate capacity.
    let released = false;
    return {
      kind: "granted",
      release: () => {
        if (released) return;
        released = true;
        outcome.release();
        this.#telemetry?.onReleased?.(command);
      },
    };
  }
}
