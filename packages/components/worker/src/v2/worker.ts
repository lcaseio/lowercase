import type { ArtifactsPort } from "@lcase/ports";
import type { JsonValue, Ref } from "@lcase/types";
import type {
  ArtifactRef,
  ExecuteJobCommand,
  JobExecutionError,
  JobExecutionOptions,
  JobResult,
} from "./job.contracts.js";
import type { JobExecutionPort } from "./ports/inbound/job-execution.port.js";
import type { ResourcePermitPort } from "./ports/outbound/resource-permit.port.js";
import type { WorkerLifecycleEventSink } from "./ports/outbound/worker-event-sink.port.js";
import type {
  ProtocolExecutor,
  ProtocolResult,
} from "./protocol/protocol-executor.types.js";
import {
  makeJobExecutionCancelledEvent,
  makeJobExecutionCompletedEvent,
  makeJobExecutionFailedEvent,
  makeJobExecutionStartedEvent,
} from "./worker-lifecycle.events.js";

export type WorkerV2Deps = {
  permits: ResourcePermitPort;
  lifecycle: WorkerLifecycleEventSink;
  protocol: ProtocolExecutor;
  artifacts: ArtifactsPort;
};

type ProtocolRunOutcome =
  { kind: "result"; result: ProtocolResult } | { kind: "cancelled" };

type StoredExecutionOutputs = {
  output: ArtifactRef;
  exports?: Record<string, ArtifactRef>;
};

type StoreExecutionOutputsOutcome =
  | { ok: true; outputs: StoredExecutionOutputs }
  | { ok: false; error: JobExecutionError; output?: ArtifactRef };

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
}

function cancelledResult(command: ExecuteJobCommand): JobResult {
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

function failedResult(
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

function completedResult(
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

export class WorkerV2 implements JobExecutionPort {
  readonly #deps: WorkerV2Deps;

  constructor(deps: WorkerV2Deps) {
    this.#deps = deps;
  }

  async execute(
    command: ExecuteJobCommand,
    options?: JobExecutionOptions,
  ): Promise<JobResult> {
    const { lifecycle } = this.#deps;
    const signal = options?.signal;

    validateCommand(command);

    if (signal?.aborted) {
      return cancelledResult(command);
    }

    // worker execution capacity gate: deferred, see
    // docs/component-architecture/worker-v2/README.md's
    // "Open Questions That Do Not Block Phase 1"

    await lifecycle.record(makeJobExecutionStartedEvent(command));

    // Return value intentionally discarded for Phase 1 -- resolved but not
    // yet bound into the protocol request. Real ref-binding semantics
    // (mirroring old worker's bindValueRefs) are Phase 2's job once a
    // concrete protocol shape (HTTP JSON) exists.
    await this.#resolveRefs(command.refs);

    const protocolRun = await this.#runProtocol(command, signal);
    if (protocolRun.kind === "cancelled") {
      await lifecycle.record(makeJobExecutionCancelledEvent(command));
      return cancelledResult(command);
    }
    const protocolResult = protocolRun.result;

    if (!protocolResult.ok) {
      await lifecycle.record(
        makeJobExecutionFailedEvent(command, protocolResult.error),
      );
      return failedResult(command, protocolResult.error);
    }

    const stored = await this.#storeExecutionOutputs(
      command,
      protocolResult.payload,
    );
    if (!stored.ok) {
      await lifecycle.record(
        makeJobExecutionFailedEvent(command, stored.error),
      );
      return failedResult(command, stored.error, stored.output);
    }

    const { output, exports } = stored.outputs;
    await lifecycle.record(
      makeJobExecutionCompletedEvent(command, output, exports),
    );
    return completedResult(command, stored.outputs);
  }

  async #runProtocol(
    command: ExecuteJobCommand,
    signal?: AbortSignal,
  ): Promise<ProtocolRunOutcome> {
    try {
      return {
        kind: "result",
        result: await this.#runProtocolWithPermit(command, signal),
      };
    } catch (err) {
      // Permit adapters do not share a canonical AbortError. Classify both
      // permit-wait and protocol-invocation cancellation by signal state.
      if (signal?.aborted) return { kind: "cancelled" };
      throw err;
    }
  }

  async #runProtocolWithPermit(
    command: ExecuteJobCommand,
    signal?: AbortSignal,
  ): Promise<ProtocolResult> {
    const { permits, protocol } = this.#deps;
    const grant = await permits.acquire(
      {
        requestId: command.executionId,
        resourceKey: command.protocol.kind,
      },
      { signal },
    );

    try {
      return await protocol.execute(command.protocol, { signal });
    } finally {
      await permits.release(grant.grantId);
    }
  }

  async #storeExecutionOutputs(
    command: ExecuteJobCommand,
    payload: JsonValue,
  ): Promise<StoreExecutionOutputsOutcome> {
    const outputResult = await this.#deps.artifacts.putJson(payload);
    if (!outputResult.ok) {
      return {
        ok: false,
        error: {
          code: "OUTPUT_STORE_FAILED",
          message: outputResult.error.message,
          retryable: false,
        },
      };
    }

    const output: ArtifactRef = { hash: outputResult.value };

    // Phase 1 only supports the primary output. Phase 2 replaces this branch
    // with per-export validation and storage against the real protocol shape.
    if (command.exports && Object.keys(command.exports).length > 0) {
      return {
        ok: false,
        error: {
          code: "EXPORT_VALIDATION_FAILED",
          message: "Export storage is not implemented in Worker V2 Phase 1",
          retryable: false,
        },
        output,
      };
    }

    return { ok: true, outputs: { output } };
  }

  async #resolveRefs(refs: Ref[]): Promise<Record<string, unknown>> {
    const resolved: Record<string, unknown> = {};
    for (const ref of refs) {
      if (ref.hash === null) continue;
      const result = await this.#deps.artifacts.getJson(ref.hash);
      if (result.ok) {
        resolved[ref.string] = result.value;
      }
    }
    return resolved;
  }
}

export function createWorkerV2(deps: WorkerV2Deps): JobExecutionPort {
  return new WorkerV2(deps);
}
