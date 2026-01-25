import type { EventSink } from "./observability-sink.port.js";

export interface ObservabilityTapPort {
  start(): void;
  stop(): void;
  attachSink(sink: EventSink): void;
  detachSink(sink: EventSink): void;
}
