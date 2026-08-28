import type { ArtifactsPort, WorkerPort } from "@lcase/ports";
import type { JobExecutionPort } from "@lcase/worker";
import {
  createConsoleWorkerLifecycleEventSink,
  createHttpJsonExecutor,
  createLocalResourcePermit,
  createWorkerV2,
} from "@lcase/worker";
import type { WorkerConfig } from "../types/runtime.config.js";

export type CreateWorkerV2CoreDeps = {
  artifacts: ArtifactsPort;
};

// Composition only -- construction logic lives in packages/components/worker,
// translation logic lives in packages/integrations' engine-worker subpath.
// Worker V2 plan Phase 4: exposes the raw, callable core directly instead of
// immediately hiding it behind a self-running queue consumer (PR 4's
// createWorkerV2Compat did that) -- packages/integrations' LocalWorkerJobExecutor
// needs a real reference to call.
export function createWorkerV2Core(
  deps: CreateWorkerV2CoreDeps,
  config: WorkerConfig,
): JobExecutionPort {
  const permits = createLocalResourcePermit({
    maxConcurrencyPerKey: config.maxConcurrencyPerKey,
  });
  const lifecycle = createConsoleWorkerLifecycleEventSink();
  const protocol = createHttpJsonExecutor({ fetch });

  return createWorkerV2(
    { permits, lifecycle, protocol, artifacts: deps.artifacts },
    {
      maxConcurrentJobs: config.maxConcurrentJobs,
      protocolTimeoutMs: config.protocolTimeoutMs,
    },
  );
}

// Temporary placeholder for RuntimeContext.worker/SystemServiceDeps.worker,
// which have no real work left once httpjson dispatches directly (Phase 4)
// and mcp already has no consumer (since PR 4 -- see docs/todo.md). A genuine
// no-op, not a stub that pretends to do something: start()/stop()/
// stopAllJobWaiters() all resolve immediately. Phase 5/6 removes this surface
// (RuntimeContext.worker, SystemServiceDeps.worker, and this function) once
// nothing depends on the WorkerPort shape anymore -- not this PR's job, per
// this project's "don't touch dying code proactively" precedent.
export function createNoopLegacyWorker(): WorkerPort {
  return {
    async start() {},
    async stop() {},
    async stopAllJobWaiters() {},
  };
}
