import type { ConcurrencyLimiterPort } from "@lcase/ports";
import type { EventBusPort } from "@lcase/ports/bus";
import type { EmitterFactoryPort } from "@lcase/ports/events";
import type { AnyEvent } from "@lcase/types";

type BusTopic = string;
type Unsubscribe = ReturnType<EventBusPort["subscribe"]>;

type ToolCounters = {
  [ToolId in string]: {
    limit: number;
    count: number;
  };
};

export class ConcurrencyLimiter implements ConcurrencyLimiterPort {
  busTopics = new Map<BusTopic, Unsubscribe>();
  toolCounters: ToolCounters = {};

  constructor(
    private readonly bus: EventBusPort,
    private readonly ef: EmitterFactoryPort
  ) {}

  // subscribe to bus topics
  start() {
    const tool = "scheduler.tool.requested";
    this.busTopics.set(
      tool,
      this.bus.subscribe(tool, async () => {})
    );
  }
  // unsubscribe from all bus topics
  stop() {
    for (const [busTopic, callback] of this.busTopics.entries()) {
      callback();
    }
    this.busTopics.clear();
  }

  async handleToolRequested(event: AnyEvent) {
    // check type or parsed
    // "throttler.tool.granted"
    // "throttler.tool.denied",
  }
}
