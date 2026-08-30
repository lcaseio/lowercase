import type { ArtifactReadWritePort } from "@lcase/ports";
import type { JobExecutionPort } from "@lcase/worker";
import {
  createConsoleWorkerLifecycleEventSink,
  createHttpJsonExecutor,
  createLocalResourcePermit,
  createWorker,
} from "@lcase/worker";
import type { WorkerConfig } from "../types/runtime.config.js";

export type CreateWorkerCoreDeps = {
  artifacts: ArtifactReadWritePort;
};

// Composition only -- construction logic lives in packages/components/worker,
// translation logic lives in packages/integrations' engine-worker subpath.
// Exposes the raw, callable core directly -- packages/integrations'
// LocalWorkerJobExecutor needs a real reference to call.
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
