import { NodeRouter } from "@lcase/router";
import { PrismaArtifactRepository } from "@lcase/adapters/artifact-repository";
import { PrismaFlowRepository } from "@lcase/adapters/flow-repository";
import { PrismaRunQuery } from "@lcase/adapters/run-query";
import { PrismaRunRepository } from "@lcase/adapters/run-repository";
import { PrismaRunStepProjectionRepository } from "@lcase/adapters/run-step-projection-repository";
import { PrismaSimRepository } from "@lcase/adapters/sim-repository";
import { PrismaEvalResultRepository } from "@lcase/adapters/eval-result-repository";
import { Engine } from "@lcase/engine";

import { EmitterFactory, eventSchemaRegistry } from "@lcase/events";
import type {
  ArtifactsPort,
  EventBusPort,
  JobParserPort,
  RunQueryPort,
} from "@lcase/ports";
import type { JobExecutorPort } from "@lcase/ports/engine";
import { LocalWorkerJobExecutor } from "@lcase/integrations/engine-worker";
import {
  makeBusFactory,
  makeQueueFactory,
} from "./factories/registry.factory.js";
import type {
  ObservabilityConfig,
  RuntimeConfig,
} from "./types/runtime.config.js";
import type { RuntimeContext, SinkMap } from "./types/runtime.context.js";
import {
  ConsoleSink,
  ObservabilityTap,
  ReplaySink,
  SqlRunProjectionSink,
  EvalResultProjectionSink,
  WebSocketServerSink,
} from "@lcase/observability";
import { WorkflowRuntime } from "./workflow.runtime.js";
import {
  FlowService,
  ReplayService,
  SimService,
  SystemService,
} from "@lcase/app-services";
import { JobParser } from "@lcase/events/parsers";
import { JsonlEventLog } from "@lcase/adapters/event-store";
import path from "path";
import { ReplayEngine } from "@lcase/replay";
import { createLimiter } from "./wire-functions/create-limiter.js";
import { ConcurrencyLimiter } from "@lcase/limiter";
import { createArtifacts } from "./wire-functions/create-artifacts.js";
import {
  createNoopLegacyWorker,
  createWorkerV2Core,
} from "./worker-v2/create-worker-v2.js";
import { prisma } from "../../db-prisma/dist/client.js";

export function createRuntime(config: RuntimeConfig): WorkflowRuntime {
  const ctx = makeRuntimeContext(config);

  const flowService = new FlowService(
    ctx.artifacts,
    new PrismaFlowRepository(prisma),
  );

  const replayService = new ReplayService(ctx.replay);
  const flowRepository = new PrismaFlowRepository(prisma);
  const artifactRepository = new PrismaArtifactRepository(prisma);
  const runQuery = new PrismaRunQuery(prisma, artifactRepository);
  const simService = new SimService(
    ctx.artifacts,
    ctx.ef,
    runQuery,
    new PrismaSimRepository(prisma),
    flowRepository,
  );
  const systemService = new SystemService({
    bus: ctx.bus,
    ef: ctx.ef,
    engine: ctx.engine,
    limiter: ctx.limiter,
    router: ctx.router,
    sinks: ctx.sinks,
    tap: ctx.tap,
    worker: ctx.worker,
  });
  const runtime = new WorkflowRuntime(ctx, {
    flowService,
    replayService,
    simService,
    systemService,
  });
  return runtime;
}

export function makeRuntimeContext(config: RuntimeConfig): RuntimeContext {
  const busFactory = makeBusFactory(
    config.bus.placement,
    config.bus.transport,
    config.bus.store,
  );

  const bus = busFactory();

  const queueFactory = makeQueueFactory(
    config.queue.placement,
    config.queue.transport,
    config.queue.store,
  );
  const queue = queueFactory();

  const ef = new EmitterFactory(bus);
  const router = new NodeRouter(bus, queue, ef);

  const jobParser = new JobParser(eventSchemaRegistry);

  const artifacts = createArtifacts(
    config.artifacts,
    new PrismaArtifactRepository(prisma),
  );
  const artifactRepository = new PrismaArtifactRepository(prisma);
  const runQuery = new PrismaRunQuery(prisma, artifactRepository);

  // Worker V2 plan Phase 4: engine calls Worker V2 directly via jobExecutor,
  // bypassing the router/queue for the monolith path. `worker` (RuntimeContext.
  // worker/SystemServiceDeps.worker) has no real work left once httpjson goes
  // direct and mcp already has no consumer -- see createNoopLegacyWorker.
  const workerCore = createWorkerV2Core({ artifacts }, config.worker);
  const jobExecutor: JobExecutorPort = new LocalWorkerJobExecutor(workerCore);
  const worker = createNoopLegacyWorker();

  const engine = createInProcessEngine(
    bus,
    ef,
    jobParser,
    runQuery,
    artifacts,
    jobExecutor,
  );

  const { tap, sinks } = createObservability(
    config.observability,
    bus,
    artifacts,
    runQuery,
  );

  const cl = new ConcurrencyLimiter(bus, ef);
  const limiter = createLimiter(config.limiter, { bus, ef, cl });

  const replay = new ReplayEngine(
    new JsonlEventLog(path.resolve(process.cwd(), "lcase-db/replay")),
    bus,
    ef,
  );

  return {
    queue,
    bus,
    router,
    engine,
    worker,
    tap,
    sinks,
    ef,
    replay,
    limiter,
    artifacts,
  };
}

export function createObservability(
  config: ObservabilityConfig,
  bus: EventBusPort,
  artifacts: ArtifactsPort,
  runQuery: RunQueryPort,
): { tap: ObservabilityTap; sinks: SinkMap } {
  const tap = new ObservabilityTap(bus);
  const sinks: SinkMap = {};
  tap.attachSink(
    new SqlRunProjectionSink(
      new PrismaRunRepository(prisma),
      new PrismaRunStepProjectionRepository(prisma),
    ),
  );
  tap.attachSink(
    new EvalResultProjectionSink(
      new PrismaEvalResultRepository(prisma),
      artifacts,
      runQuery,
    ),
  );
  if (config.sinks) {
    for (const sink of config.sinks) {
      // TODO: move sink settings to config, not hardcoded
      switch (sink) {
        case "console-log-sink":
          const consoleSink = new ConsoleSink({
            allVerbose: false,
            verboseEvents: new Set([
              "job.httpjson.started",
              "tool.failed",
              "tool.completed",
            ]),
          });
          sinks["console-log-sink"] = consoleSink;
          tap.attachSink(consoleSink);
          break;
        case "websocket-sink":
          if (config.webSocketPort !== undefined) {
            const webSocketServerSink = new WebSocketServerSink(
              config.webSocketPort,
            );
            sinks["websocket-sink"] = webSocketServerSink;
            tap.attachSink(webSocketServerSink);
          }
          break;
        case "replay-jsonl-sink":
          const absoluteDirPath = path.resolve(
            process.cwd(),
            "lcase-db/replay",
          );
          const replaySink = new ReplaySink(new JsonlEventLog(absoluteDirPath));
          sinks["replay-jsonl-sink"] = replaySink;
          tap.attachSink(replaySink);

          break;
        default:
          break;
      }
    }
  }
  return { tap, sinks };
}

export function createInProcessEngine(
  bus: EventBusPort,
  ef: EmitterFactory,
  jobParser: JobParserPort,
  runQuery: RunQueryPort,
  artifacts: ArtifactsPort,
  jobExecutor: JobExecutorPort,
): Engine {
  const engine = new Engine({
    bus,
    ef,
    jobParser,
    runQuery,
    artifacts,
    jobExecutor,
  });

  return engine;
}
