import type { ArtifactAccessPort } from "@lcase/ports";
import type { JobExecutionPort } from "@lcase/worker";
import {
  createConsoleWorkerLifecycleEventSink,
  createHttpJsonExecutor,
  createLocalResourcePermit,
  createWorker,
} from "@lcase/worker";
import type { WorkerConfig } from "../types/runtime.config.js";

export type CreateWorkerCoreDeps = {
  artifacts: ArtifactAccessPort;
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

// 3c2b0d67e5f299e7e0cbe858097c801845f974849922885c0f14ab8a5e28fb55
