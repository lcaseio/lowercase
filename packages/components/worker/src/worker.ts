import type {
  ArtifactReadWritePort,
  JobExecutionOutcome,
  JobExecutionRequest,
} from "@lcase/ports";
import { JobRunner } from "./job-runner.js";
import {
  toExecuteJobCommand,
  toJobExecutionOutcome,
} from "./job-message.mappers.js";
import {
  cancelledResult,
  completedResult,
  failedResult,
} from "./job-result.factories.js";
import type { ExecuteJobCommand, JobResult } from "./job.contracts.js";
import type { ResourcePermitPort } from "./ports/outbound/resource-permit.port.js";
import type { WorkerLifecycleEventSink } from "./ports/outbound/worker-event-sink.port.js";
import type { ProtocolExecutor } from "./protocol/protocol-executor.types.js";
import type { ResourceKeyResolver } from "./resource-key-resolver.js";
import {
  WorkerCapacity,
  type WorkerCapacityTelemetry,
} from "./worker-capacity.js";
import {
  makeJobExecutionCancelledEvent,
  makeJobExecutionCompletedEvent,
  makeJobExecutionFailedEvent,
  makeJobExecutionStartedEvent,
} from "./worker-lifecycle.events.js";

export type WorkerDeps = {
  permits: ResourcePermitPort;
  lifecycle: WorkerLifecycleEventSink;
  protocol: ProtocolExecutor;
  artifacts: ArtifactReadWritePort;
  resourceKeyResolver?: ResourceKeyResolver;
  capacityTelemetry?: WorkerCapacityTelemetry;
};

export type WorkerConfig = {
  maxConcurrentJobs: number;
  protocolTimeoutMs: number;
};

function validateCommand(command: ExecuteJobCommand): void {
  if (!command.executionId) {
    throw new Error("ExecuteJobCommand.executionId is required");
  }
  if (!command.jobId) {
    throw new Error("ExecuteJobCommand.jobId is required");
  }
  if (!command.runId) {
    throw new Error("ExecuteJobCommand.runId is required");
  }
  if (!command.stepId) {
    throw new Error("ExecuteJobCommand.stepId is required");
  }
  if (!command.protocol) {
    throw new Error("ExecuteJobCommand.protocol is required");
  }
  if (command.protocol.kind !== "httpjson") {
    throw new Error(
      `Unsupported protocol kind "${String(command.protocol.kind)}"`,
    );
  }
}

// The worker component itself: the object runtime constructs and retains.
// It owns the component-wide capacity bound and the accepted/started/terminal
// lifecycle sequence, and delegates the mechanics of one job to JobRunner.
// JobRunner and WorkerCapacity are built here rather than injected, so there
// is no way to compose a Worker that bypasses either.
export class Worker {
  readonly #lifecycle: WorkerLifecycleEventSink;
  readonly #capacity: WorkerCapacity;
  readonly #runner: JobRunner;

  constructor(deps: WorkerDeps, config: WorkerConfig) {
    this.#lifecycle = deps.lifecycle;
    this.#capacity = new WorkerCapacity(
      { maxConcurrentJobs: config.maxConcurrentJobs },
      deps.capacityTelemetry,
    );
    this.#runner = new JobRunner(deps, {
      protocolTimeoutMs: config.protocolTimeoutMs,
    });
  }

  // TEMPORARY, deleted in the HTTP JSON Message cutover. It exists only so
  // the engine can keep its current direct dependency while worker's
  // ownership is restructured, which is what makes that restructuring
  // independently mergeable. Structurally a JobExecutionPort without
  // declaring it: no caller supplies the port's `options`, so the cancellation
  // signal is reached through executeCommand() instead. Do not add callers.
  async execute(request: JobExecutionRequest): Promise<JobExecutionOutcome> {
    const result = await this.executeCommand(toExecuteJobCommand(request));
    return toJobExecutionOutcome(result);
  }

  // Worker's real entry point for one job, in its own command vocabulary.
  // The Message handler added by the cutover lands here too, after
  // interpreting the submitted envelope.
  async executeCommand(
    command: ExecuteJobCommand,
    callerSignal?: AbortSignal,
  ): Promise<JobResult> {
    const acquisition = await this.#capacity.acquire(command, callerSignal);
    if (acquisition.kind === "cancelled") {
      // No lifecycle facts recorded -- execution never reached "started".
      return cancelledResult(command);
    }

    try {
      return await this.#executeAdmitted(command, callerSignal);
    } finally {
      acquisition.release();
    }
  }

  async #executeAdmitted(
    command: ExecuteJobCommand,
    callerSignal: AbortSignal | undefined,
  ): Promise<JobResult> {
    validateCommand(command);

    // Re-checked after admission: the caller may have abandoned the job while
    // it was queued for capacity.
    if (callerSignal?.aborted) {
      return cancelledResult(command);
    }

    await this.#lifecycle.record(makeJobExecutionStartedEvent(command));

    const outcome = await this.#runner.run(command, callerSignal);
    switch (outcome.kind) {
      case "completed": {
        const { output, exports } = outcome.outputs;
        await this.#lifecycle.record(
          makeJobExecutionCompletedEvent(command, output, exports),
        );
        return completedResult(command, outcome.outputs);
      }
      case "failed":
        await this.#lifecycle.record(
          makeJobExecutionFailedEvent(command, outcome.error),
        );
        return failedResult(command, outcome.error, outcome.output);
      case "cancelled":
        await this.#lifecycle.record(makeJobExecutionCancelledEvent(command));
        return cancelledResult(command);
    }
  }
}
