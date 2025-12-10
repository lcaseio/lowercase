import { InMemoryQueue } from "@lcase/adapters/queue";
import { NodeRouter } from "@lcase/adapters/router";
import { Worker } from "@lcase/worker";
import { allToolBindingsMap, ToolRegistry } from "@lcase/tools";
import { InMemoryStreamRegistry } from "@lcase/adapters/stream";
import { FlowStore, FlowStoreFs } from "@lcase/adapters/flow-store";
import { Engine, PipeResolver } from "@lcase/engine";

import { EmitterFactory, eventRegistry } from "@lcase/events";
import {
  EventBusPort,
  FlowParserPort,
  JobParserPort,
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
  WebSocketServerSink,
} from "@lcase/observability";
import { WorkflowRuntime } from "./workflow.runtime.js";
import { FlowService } from "@lcase/services";
import { ResourceManager } from "@lcase/resource-manager";
import { JobParser } from "@lcase/events/parsers";

export function createRuntime(config: RuntimeConfig): WorkflowRuntime {
  const ctx = makeRuntimeContext(config);

  const ef = new EmitterFactory(ctx.bus);

  const flowService = new FlowService(ctx.bus, ef, new FlowStoreFs());
  const runtime = new WorkflowRuntime(ctx, { flowService });
  return runtime;
}

export function makeRuntimeContext(config: RuntimeConfig): RuntimeContext {
  const busFactory = makeBusFactory(
    config.bus.placement,
    config.bus.transport,
    config.bus.store
  );

  const bus = busFactory();

  const queueFactory = makeQueueFactory(
    config.queue.placement,
    config.queue.transport,
    config.queue.store
  );
  const queue = queueFactory();

  const ef = new EmitterFactory(bus);
  const router = new NodeRouter(bus, queue, ef);
  const streamRegistry = new InMemoryStreamRegistry();
  const flowStore = new FlowStore();

  const jobParser = new JobParser(eventRegistry);
  const rm = new ResourceManager({
    bus,
    ef,
    queue,
    jobParser,
  });

  const engine = createInProcessEngine(bus, streamRegistry, ef, jobParser);

  const worker = createInProcessWorker(
    config.worker.id,
    bus,
    queue,
    streamRegistry,
    ef,
    jobParser,
    config.worker
  );

  const { tap, sinks } = createObservability(config.observability, bus);

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
    rm,
  };
}

export function createObservability(
  config: ObservabilityConfig,
  bus: EventBusPort
): { tap: ObservabilityTap; sinks: SinkMap } {
  const tap = new ObservabilityTap(bus);
  const sinks: SinkMap = {};
  if (config.sinks) {
    for (const sink of config.sinks) {
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
              config.webSocketPort
            );
            sinks["websocket-sink"] = webSocketServerSink;
            tap.attachSink(webSocketServerSink);
          }
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
  streamRegistry: StreamRegistryPort,
  emitterFactory: EmitterFactory,
  jobParser: JobParserPort
): Engine {
  const pipeResolver = new PipeResolver(streamRegistry);

  const engine = new Engine({
    bus,
    ef: emitterFactory,
    jobParser,
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
  config: WorkerConfig
): Worker {
  const toolRegistry = new ToolRegistry(allToolBindingsMap);
  const worker = new Worker(id, {
    bus,
    emitterFactory,
    queue,
    streamRegistry,
    toolRegistry,
    jobParser,
  });

  // NOTE: add custom config for tools

  return worker;
}
