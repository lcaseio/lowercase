import { InMemoryQueue } from "@lcase/adapters/queue";
import { NodeRouter } from "@lcase/adapters/router";
import { PrismaArtifactRepository } from "@lcase/adapters/artifact-repository";
import { PrismaFlowRepository } from "@lcase/adapters/flow-repository";
import { PrismaRunQuery } from "@lcase/adapters/run-query";
import { PrismaRunRepository } from "@lcase/adapters/run-repository";
import { PrismaRunStepProjectionRepository } from "@lcase/adapters/run-step-projection-repository";
import { PrismaSimRepository } from "@lcase/adapters/sim-repository";
import { Worker } from "@lcase/worker";
import { allToolBindingsMap, ToolRegistry } from "@lcase/tools";
import { InMemoryStreamRegistry } from "@lcase/adapters/stream";
import { FlowStore, FlowStoreFs } from "@lcase/adapters/flow-store";
import { Engine } from "@lcase/engine";

import { EmitterFactory, eventSchemaRegistry } from "@lcase/events";
import type {
  ArtifactsPort,
  EventBusPort,
  IndexStorePort,
  JobParserPort,
  RunQueryPort,
  StreamRegistryPort,
} from "@lcase/ports";
import {
  makeBusFactory,
  makeQueueFactory,
} from "./factories/registry.factory.js";
import type {
  ObservabilityConfig,
  RuntimeConfig,
  WorkerConfig,
} from "./types/runtime.config.js";
import type { RuntimeContext, SinkMap } from "./types/runtime.context.js";
import {
  ConsoleSink,
  ObservabilityTap,
  ReplaySink,
  RunIndexSink,
  SqlRunProjectionSink,
  WebSocketServerSink,
} from "@lcase/observability";
import { WorkflowRuntime } from "./workflow.runtime.js";
import {
  FlowService,
  ReplayService,
  SimService,
  SystemService,
  WsService,
} from "@lcase/services";
import { JobParser } from "@lcase/events/parsers";
import { JsonlEventLog } from "@lcase/adapters/event-store";
import path from "path";
import { ReplayEngine } from "@lcase/replay";
import { createLimiter } from "./wire-functions/create-limiter.js";
import { ConcurrencyLimiter } from "@lcase/limiter";
import { createArtifacts } from "./wire-functions/create-artifacts.js";
import { FsRunIndexStore } from "@lcase/adapters/run-index-store";
import { FsJsonIndexStore } from "../../adapters/dist/index-store/fs-json-index-store.js";
import { RunIndex } from "@lcase/types";
import { prisma } from "../../db-prisma/dist/client.js";

export function createRuntime(config: RuntimeConfig): WorkflowRuntime {
  const ctx = makeRuntimeContext(config);

  const ef = new EmitterFactory(ctx.bus);

  const flowService = new FlowService(
    ctx.bus,
    ctx.ef,
    new FlowStoreFs(),
    ctx.artifacts,
    new PrismaFlowRepository(prisma),
  );

  const replayService = new ReplayService(ctx.replay);
  const flowRepository = new PrismaFlowRepository(prisma);
  const runQuery = new PrismaRunQuery(prisma);
  const simService = new SimService(
    ctx.artifacts,
    ctx.ef,
    runQuery,
    new PrismaSimRepository(prisma),
    flowRepository,
  );
  const wsService = new WsService(ctx.bus);

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
    wsService,
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
  const streamRegistry = new InMemoryStreamRegistry();
  const flowStore = new FlowStore();

  const jobParser = new JobParser(eventSchemaRegistry);

  const runIndexStoreOld = new FsRunIndexStore(
    path.resolve(process.cwd(), "lcase-db/runs/index"),
  );

  const runIndexStore = new FsJsonIndexStore<RunIndex>({
    dir: path.resolve(process.cwd(), "lcase-db/runs/index"),
    extension: ".index.json",
  });

  const artifacts = createArtifacts(
    config.artifacts,
    new PrismaArtifactRepository(prisma),
  );
  const runQuery = new PrismaRunQuery(prisma);
  const engine = createInProcessEngine(
    bus,
    ef,
    jobParser,
    runQuery,
    artifacts,
  );

  const worker = createInProcessWorker(
    config.worker.id,
    bus,
    queue,
    streamRegistry,
    ef,
    jobParser,
    artifacts,
    config.worker,
  );

  const { tap, sinks } = createObservability(config.observability, bus);

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
    flowStore,
    tap,
    sinks,
    ef,
    replay,
    limiter,
    artifacts,
    runIndexStore,
  };
}

export function createObservability(
  config: ObservabilityConfig,
  bus: EventBusPort,
): { tap: ObservabilityTap; sinks: SinkMap } {
  const tap = new ObservabilityTap(bus);
  const sinks: SinkMap = {};
  tap.attachSink(
    new RunIndexSink(
      new FsRunIndexStore(path.resolve(process.cwd(), "lcase-db/runs/index")),
    ),
  );
  tap.attachSink(
    new SqlRunProjectionSink(
      new PrismaRunRepository(prisma),
      new PrismaRunStepProjectionRepository(prisma),
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
): Engine {
  const engine = new Engine({
    bus,
    ef,
    jobParser,
    runQuery,
    artifacts,
  });

  return engine;
}

export function createInProcessWorker(
  id: string,
  bus: EventBusPort,
  queue: InMemoryQueue,
  streamRegistry: StreamRegistryPort,
  emitterFactory: EmitterFactory,
  jobParser: JobParserPort,
  artifacts: ArtifactsPort,
  config: WorkerConfig,
): Worker {
  const toolRegistry = new ToolRegistry(allToolBindingsMap);
  const worker = new Worker(id, {
    bus,
    emitterFactory,
    queue,
    streamRegistry,
    toolRegistry,
    jobParser,
    artifacts,
  });

  // NOTE: add custom config for tools

  return worker;
}
