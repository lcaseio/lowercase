import { resolveJsonPath } from "@lcase/json-ref-binder";
import type { ArtifactsPort } from "@lcase/ports";
import type { Ref } from "@lcase/types";
import {
  storeExecutionOutputs,
  tryStoreOutput,
} from "./execution-output-storage.js";
import {
  cancelledResult,
  completedResult,
  failedResult,
  type StoredExecutionOutputs,
} from "./job-result.factories.js";
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
import { combineForProtocolRun } from "./protocol/combine-for-protocol-run.js";
import type { ResolvedHttpJsonRequest } from "./protocol/http-json/http-json.types.js";
import { materializeHttpJsonRequest } from "./protocol/http-json/materialize-http-json-request.js";
import type {
  ProtocolExecutor,
  ProtocolResult,
} from "./protocol/protocol-executor.types.js";
import {
  defaultResourceKeyResolver,
  type ResourceKeyResolver,
} from "./resource-key-resolver.js";
import {
  type WorkerCapacityTelemetry,
  withWorkerCapacity,
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
  artifacts: ArtifactsPort;
  resourceKeyResolver?: ResourceKeyResolver;
};

export type WorkerCoreConfig = {
  maxConcurrentJobs: number;
  protocolTimeoutMs: number;
};

type ProtocolRunOutcome =
  | { kind: "result"; result: ProtocolResult }
  | { kind: "cancelled" }
  | { kind: "timeout" };

type ResolveRefsOutcome =
  | { ok: true; resolved: Record<string, unknown> }
  | { ok: false; error: JobExecutionError };

type PrepareProtocolRunOutcome =
  | {
      ok: true;
      request: ResolvedHttpJsonRequest;
      resourceKey: string;
    }
  | { ok: false; error: JobExecutionError };

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

function nonRetryableError(
  code: JobExecutionError["code"],
  message: string,
): JobExecutionError {
  return { code, message, retryable: false };
}

class Worker implements JobExecutionPort {
  readonly #deps: WorkerDeps;
  readonly #config: WorkerCoreConfig;
  readonly #resolveKey: ResourceKeyResolver;

  constructor(deps: WorkerDeps, config: WorkerCoreConfig) {
    this.#deps = deps;
    this.#config = config;
    this.#resolveKey = deps.resourceKeyResolver ?? defaultResourceKeyResolver;
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

    await lifecycle.record(makeJobExecutionStartedEvent(command));

    const prepared = await this.#prepareProtocolRun(command);
    if (!prepared.ok) {
      return this.#finishFailedExecution(command, prepared.error);
    }

    const protocolRun = await this.#runProtocol(
      command,
      prepared.request,
      prepared.resourceKey,
      signal,
    );

    if (protocolRun.kind === "cancelled") {
      return this.#finishCancelledExecution(command);
    }
    if (protocolRun.kind === "timeout") {
      return this.#finishFailedExecution(
        command,
        nonRetryableError(
          "TIMEOUT",
          "Protocol execution exceeded the configured timeout",
        ),
      );
    }

    const protocolResult = protocolRun.result;
    if (!protocolResult.ok) {
      // Best-effort: a secondary storage failure here must not mask the
      // primary, more important protocol error.
      const output =
        protocolResult.payload !== undefined
          ? await tryStoreOutput(this.#deps.artifacts, protocolResult.payload)
          : undefined;
      return this.#finishFailedExecution(command, protocolResult.error, output);
    }

    const stored = await storeExecutionOutputs(
      this.#deps.artifacts,
      protocolResult.payload,
      command.exports,
    );
    if (!stored.ok) {
      return this.#finishFailedExecution(command, stored.error, stored.output);
    }

    return this.#finishCompletedExecution(command, stored.outputs);
  }

  async #prepareProtocolRun(
    command: ExecuteJobCommand,
  ): Promise<PrepareProtocolRunOutcome> {
    const refsOutcome = await this.#resolveRefs(command.refs);
    if (!refsOutcome.ok) return refsOutcome;

    const materialized = materializeHttpJsonRequest(
      command.protocol,
      command.refs,
      refsOutcome.resolved,
    );
    if (!materialized.ok) {
      return {
        ok: false,
        error: nonRetryableError("HTTP_REQUEST_INVALID", materialized.message),
      };
    }

    const keyResult = this.#resolveKey(
      materialized.request,
      command.resourceHint,
    );
    if (!keyResult.ok) {
      return {
        ok: false,
        error: nonRetryableError(
          "RESOURCE_KEY_RESOLUTION_FAILED",
          keyResult.message,
        ),
      };
    }

    return {
      ok: true,
      request: materialized.request,
      resourceKey: keyResult.resourceKey,
    };
  }

  async #finishFailedExecution(
    command: ExecuteJobCommand,
    error: JobExecutionError,
    output?: ArtifactRef,
  ): Promise<JobResult> {
    await this.#deps.lifecycle.record(
      makeJobExecutionFailedEvent(command, error),
    );
    return failedResult(command, error, output);
  }

  async #finishCancelledExecution(
    command: ExecuteJobCommand,
  ): Promise<JobResult> {
    await this.#deps.lifecycle.record(makeJobExecutionCancelledEvent(command));
    return cancelledResult(command);
  }

  async #finishCompletedExecution(
    command: ExecuteJobCommand,
    outputs: StoredExecutionOutputs,
  ): Promise<JobResult> {
    const { output, exports } = outputs;
    await this.#deps.lifecycle.record(
      makeJobExecutionCompletedEvent(command, output, exports),
    );
    return completedResult(command, outputs);
  }

  async #runProtocol(
    command: ExecuteJobCommand,
    request: ResolvedHttpJsonRequest,
    resourceKey: string,
    signal: AbortSignal | undefined,
  ): Promise<ProtocolRunOutcome> {
    const combined = combineForProtocolRun(
      signal,
      this.#config.protocolTimeoutMs,
    );
    try {
      return {
        kind: "result",
        result: await this.#runProtocolWithPermit(
          command,
          request,
          resourceKey,
          signal,
          combined.signal,
        ),
      };
    } catch (err) {
      const cause = combined.cause();
      if (cause === "caller") return { kind: "cancelled" };
      if (cause === "timeout") return { kind: "timeout" };
      throw err;
    } finally {
      combined.dispose();
    }
  }

  async #runProtocolWithPermit(
    command: ExecuteJobCommand,
    request: ResolvedHttpJsonRequest,
    resourceKey: string,
    callerSignal: AbortSignal | undefined,
    protocolSignal: AbortSignal,
  ): Promise<ProtocolResult> {
    const { permits, protocol } = this.#deps;
    const grant = await permits.acquire(
      { requestId: command.executionId, resourceKey },
      { signal: callerSignal },
    );

    try {
      return await protocol.execute(request, { signal: protocolSignal });
    } finally {
      await permits.release(grant.grantId);
    }
  }

  async #resolveRefs(refs: Ref[]): Promise<ResolveRefsOutcome> {
    const resolved: Record<string, unknown> = {};
    for (const ref of refs) {
      if (ref.hash === null) continue;
      const value = await this.#resolveOneRef(ref);
      if (value === undefined) {
        return {
          ok: false,
          error: {
            code: "INPUT_RESOLUTION_FAILED",
            message: `Could not resolve reference "${ref.string}"`,
            retryable: false,
          },
        };
      }
      resolved[ref.string] = value;
    }
    return { ok: true, resolved };
  }

  async #resolveOneRef(ref: Ref): Promise<unknown> {
    if (ref.hash === null) return undefined;
    const { artifacts } = this.#deps;

    if (ref.scope === "params" && ref.paramType === "text/plain") {
      const result = await artifacts.getText(ref.hash);
      return result.ok ? result.value : undefined;
    }
    if (ref.scope === "params" && ref.paramType === "text/markdown") {
      const result = await artifacts.getMarkdown(ref.hash);
      return result.ok ? result.value : undefined;
    }
    if (ref.scope === "steps" && ref.exportType === "text/plain") {
      const result = await artifacts.getText(ref.hash);
      return result.ok ? result.value : undefined;
    }
    if (ref.scope === "steps" && ref.exportType === "text/markdown") {
      const result = await artifacts.getMarkdown(ref.hash);
      return result.ok ? result.value : undefined;
    }

    const result = await artifacts.getJson(ref.hash);
    if (!result.ok) return undefined;
    return resolveJsonPath(ref.valuePath, result.value);
  }
}

export function createWorker(
  deps: WorkerDeps,
  config: WorkerCoreConfig,
  telemetry?: WorkerCapacityTelemetry,
): JobExecutionPort {
  return withWorkerCapacity(
    new Worker(deps, config),
    { maxConcurrentJobs: config.maxConcurrentJobs },
    telemetry,
  );
}
