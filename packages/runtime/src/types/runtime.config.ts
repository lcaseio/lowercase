import { EventSink } from "@lcase/ports";
import type {
  BusPlacement,
  BusTransport,
  BusStore,
} from "../registries/bus.registry.js";
import {
  QueuePlacement,
  QueueStore,
  QueueTransport,
} from "../registries/queue.registry.js";
import { SinkId } from "./runtime.context.js";
import {
  LimiterPlacement,
  LimiterStore,
  LimiterTransport,
} from "../registries/limiter.registry.js";

export type BusConfig = {
  id: string;
  placement: BusPlacement;
  transport: BusTransport;
  store: BusStore;
};

export type QueueConfig = {
  id: string;
  placement: QueuePlacement;
  transport: QueueTransport;
  store: QueueStore;
};

export type RouterConfig = {
  id: string;
};

export type EngineConfig = {
  id: string;
};

export type WorkerConfig = {
  id: string;
};

export type StreamConfig = {
  id: string;
};

export type ObservabilityConfig = {
  id: string;
  sinks?: SinkId[];
  webSocketPort?: number;
};

export type RuntimeConfig = {
  bus: BusConfig;
  queue: QueueConfig;
  router: RouterConfig;
  engine: EngineConfig;
  worker: WorkerConfig;
  stream: StreamConfig;
  observability: ObservabilityConfig;
  limiter: LimiterConfig;
};

export type LimiterConfig = {
  id: string;
  scope: string;
  placement: LimiterPlacement;
  transport: LimiterTransport;
  store: LimiterStore;
};
