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
import {
  ArtifactsPlacement,
  ArtifactsStore,
  ArtifactsTransport,
} from "../registries/artifacts.registry.js";

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
  // Worker V2's own execution parameters -- required, no package defaults
  // (matches WorkerV2Config's existing convention).
  maxConcurrentJobs: number;
  protocolTimeoutMs: number;
  // The legacy compatibility adapter's own intake bound -- deliberately a
  // separate knob from maxConcurrentJobs, even though today's composition
  // sets them equal (see legacy-httpjson-queue-consumer.adapter.ts).
  maxInFlightJobs: number;
  // The local resource-permit adapter's own per-key concurrency limit.
  maxConcurrencyPerKey: number;
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
  artifacts: ArtifactsConfig;
};

export type LimiterConfig = {
  id: string;
  scope: string;
  placement: LimiterPlacement;
  transport: LimiterTransport;
  store: LimiterStore;
};

export type ArtifactsConfig = {
  path: string;
  placement: ArtifactsPlacement;
  transport: ArtifactsTransport;
  store: ArtifactsStore;
};
