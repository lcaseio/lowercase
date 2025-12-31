import type { ConcurrencyLimiterPort } from "@lcase/ports";
import type { EventBusPort } from "@lcase/ports/bus";
import type { EmitterFactoryPort } from "@lcase/ports/events";
import type { AnyEvent, ToolSpec } from "@lcase/types";

type BusTopic = string;
type Unsubscribe = ReturnType<EventBusPort["subscribe"]>;

export type ToolCounters = {
  [ToolId in string]: {
    limit: number;
    count: number;
  };
};

export type ToolQueueEntry = {
  schedulerId: string;
  runId: string;
  jobId: string;
};

type ToolQueues = {
  [ToolId in string]: ToolQueueEntry[];
};

export class ConcurrencyLimiter implements ConcurrencyLimiterPort {
  id: string;
  busTopics = new Map<BusTopic, Unsubscribe>();
  toolCounters: ToolCounters = {};
  toolQueues: ToolQueues = {};

  constructor(
    private readonly bus: EventBusPort,
    private readonly ef: EmitterFactoryPort,
    id: string
  ) {
    this.id = id;
  }

  // subscribe to bus topics
  start() {
    const slot = "scheduler.slot.requested";
    const slotFinished = "scheduler.slot.finished";
    this.busTopics.set(
      slot,
      this.bus.subscribe(slot, async () => {})
    );
  }
  // unsubscribe from all bus topics
  stop() {
    for (const unsubscribe of this.busTopics.values()) {
      unsubscribe();
    }
    this.busTopics.clear();
  }
  loadConfig(toolSpecs: ToolSpec[]) {
    for (const toolSpec of toolSpecs) {
      this.toolCounters[toolSpec.id] = {
        count: 0,
        limit: toolSpec.maxConcurrency,
      };
      this.toolQueues[toolSpec.id] = [];
    }
  }

  async handleToolRequested(event: AnyEvent) {
    if (event.type !== "scheduler.slot.requested") return;

    // TODO: later parse this
    const e = event as AnyEvent<"scheduler.slot.requested">;
    const toolId = e.data.toolId;

    if (!this.toolCounters[toolId]) return;
    if (this.toolCounters[toolId].count < this.toolCounters[toolId].limit) {
      this.toolCounters[toolId].count++;
      await this.emitGranted(e);
    } else {
      this.toolQueues[toolId].push({
        schedulerId: e.schedulerid,
        jobId: e.data.jobId,
        runId: e.data.runId,
      });
      await this.emitDenied(e);
    }
  }

  getToolEntry(event: AnyEvent<"scheduler.slot.requested">): ToolQueueEntry {
    const toolQueueEntry = this.toolQueues[event.data.toolId].shift();
    if (toolQueueEntry !== undefined) return toolQueueEntry;
    return {
      jobId: event.data.jobId,
      runId: event.data.runId,
      schedulerId: event.schedulerid,
    };
  }
  async emitGranted(event: AnyEvent<"scheduler.slot.requested">) {
    const toolQueueEntry = this.getToolEntry(event);

    const emitter = this.ef.newLimiterEmitterFromEvent(event, {
      limiterid: this.id,
      source: `lowercase://concurrency-limiter/${this.id}`,
    });
    await emitter.emit("limiter.slot.granted", {
      ...toolQueueEntry,
      workerId: event.schedulerid,
      toolId: event.data.toolId,
      status: "granted",
    });
  }
  async emitDenied(event: AnyEvent<"scheduler.slot.requested">) {
    const emitter = this.ef.newLimiterEmitterFromEvent(event, {
      limiterid: this.id,
      source: `lowercase://concurrency-limiter/${this.id}`,
    });
    await emitter.emit("limiter.slot.denied", {
      runId: event.data.runId,
      toolId: event.data.toolId,
      jobId: event.data.jobId,
      workerId: event.schedulerid,
      status: "denied",
    });
  }
}
