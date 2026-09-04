import type { ArtifactReadWritePort, JobExecutionPort } from "@lcase/ports";
import {
  createConsoleWorkerLifecycleEventSink,
  createHttpJsonExecutor,
  createLocalResourcePermit,
  createWorker,
} from "@lcase/worker";
import type { WorkerConfig } from "../config/worker.config.js";

export type CreateWorkerCoreDeps = {
  artifacts: ArtifactReadWritePort;
};

// Composition only -- construction and message translation both live in
// packages/components/worker. What comes back already satisfies the shared
// JobExecutionPort, so the engine can be handed it directly with no adapter
// in between.
export function createWorkerCore(
  deps: CreateWorkerCoreDeps,
  config: WorkerConfig,
): JobExecutionPort {
  const permits = createLocalResourcePermit({
    maxConcurrencyPerKey: config.maxConcurrencyPerKey,
  });
  const lifecycle = createConsoleWorkerLifecycleEventSink();
  const protocol = createHttpJsonExecutor({ fetch });

  return createWorker(
    {
      permits,
      lifecycle,
      protocol,
      artifacts: deps.artifacts,
    },
    {
      maxConcurrentJobs: config.maxConcurrentJobs,
      protocolTimeoutMs: config.protocolTimeoutMs,
    },
  );
}
