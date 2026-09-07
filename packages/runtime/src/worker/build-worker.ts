import type { ArtifactReadWritePort } from "@lcase/ports";
import {
  createConsoleWorkerLifecycleEventSink,
  createHttpJsonExecutor,
  createLocalResourcePermit,
  Worker,
} from "@lcase/worker";
import type { WorkerConfig } from "../config/worker.config.js";

export type BuildWorkerDeps = {
  artifacts: ArtifactReadWritePort;
};

// Composition only: build the collaborators worker needs from the outside --
// local resource permits, the lifecycle sink, the protocol executor -- and
// return the actual Worker. Worker's own internals (capacity, JobRunner) are
// built by Worker, so runtime cannot compose one that bypasses either.
export function buildWorker(
  deps: BuildWorkerDeps,
  config: WorkerConfig,
): Worker {
  const permits = createLocalResourcePermit({
    maxConcurrencyPerKey: config.maxConcurrencyPerKey,
  });
  const lifecycle = createConsoleWorkerLifecycleEventSink();
  const protocol = createHttpJsonExecutor({ fetch });

  return new Worker(
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
