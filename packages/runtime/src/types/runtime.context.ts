import type {
  EventBusPort,
  RouterPort,
  QueuePort,
  LimiterPort,
  ArtifactsPort,
} from "@lcase/ports";
import { Worker } from "@lcase/worker";
import { Engine } from "@lcase/engine";
import {
  ConsoleSink,
  ObservabilityTap,
  WebSocketServerSink,
  ReplaySink,
} from "@lcase/observability";
import { EmitterFactory } from "@lcase/events";
import { ReplayEngine } from "@lcase/replay";

export type SinkMap = {
  "console-log-sink"?: ConsoleSink;
  "websocket-sink"?: WebSocketServerSink;
  "replay-jsonl-sink"?: ReplaySink;
};
export type SinkId = keyof SinkMap;
export type RuntimeContext = {
  queue: QueuePort;
  bus: EventBusPort;
  router: RouterPort;
  engine: Engine;
  worker: Worker;
  tap: ObservabilityTap;
  sinks: SinkMap;
  ef: EmitterFactory;
  replay: ReplayEngine;
  limiter: LimiterPort;
  artifacts: ArtifactsPort;
};
