import type {
  ArtifactsPort,
  EventBusPort,
  QueuePort,
  WorkerPort,
} from "@lcase/ports";
import {
  createConsoleWorkerLifecycleEventSink,
  createHttpJsonExecutor,
  createLegacyHttpJsonQueueConsumer,
  createLocalResourcePermitPort,
  createWorkerV2,
} from "@lcase/worker";
import type { WorkerConfig } from "../types/runtime.config.js";

export type CreateWorkerV2CompatDeps = {
  queue: QueuePort;
  bus: EventBusPort;
  artifacts: ArtifactsPort;
};

// Composition only -- translation/consumption logic lives in
// packages/components/worker/src/v2/adapters/, not here. Returns a WorkerPort
// so it drops straight into RuntimeContext.worker/SystemServiceDeps.worker
// unchanged.
export function createWorkerV2Compat(
  deps: CreateWorkerV2CompatDeps,
  config: WorkerConfig,
): WorkerPort {
  const permits = createLocalResourcePermitPort({
    maxConcurrencyPerKey: config.maxConcurrencyPerKey,
  });
  const lifecycle = createConsoleWorkerLifecycleEventSink();
  const protocol = createHttpJsonExecutor({ fetch });

  const worker = createWorkerV2(
    { permits, lifecycle, protocol, artifacts: deps.artifacts },
    {
      maxConcurrentJobs: config.maxConcurrentJobs,
      protocolTimeoutMs: config.protocolTimeoutMs,
    },
  );

  return createLegacyHttpJsonQueueConsumer(
    { queue: deps.queue, bus: deps.bus, worker },
    { workerId: config.id, maxInFlightJobs: config.maxInFlightJobs },
  );
}
