import { EmitterFactory } from "@lcase/events";
import type { RouterPort, QueuePort, EventBusPort } from "@lcase/ports";
import type { AnyEvent, JobQueuedEvent, JobSubmittedEvent } from "@lcase/types";

export type RouterContext = {
  [capability: string]: {
    active: number;
    limit: number;
    readyQueue: string;
    waitingQueue: string;
  };
};
export class NodeRouter implements RouterPort {
  constructor(
    private readonly bus: EventBusPort,
    private readonly queue: QueuePort,
    private readonly ef: EmitterFactory
  ) {}
  async route(event: AnyEvent): Promise<void> {
    if (!event.type.endsWith(".submitted") && !event.type.startsWith("job.")) {
      return;
    }
    await this.queueJob(event as JobSubmittedEvent);
  }

  async start() {
    this.bus.subscribe("job.*.submitted", async (e) => await this.route(e));
  }
  async stop() {
    this.bus.close();
  }

  async queueJob(event: JobSubmittedEvent) {
    const newEvent = structuredClone(event) as unknown as JobQueuedEvent;
    newEvent.type = `job.${event.capid}.queued`;
    newEvent.action = "queued";

    const emitter = this.ef.newJobEmitterFromEvent(newEvent, "lowercase://rm");
    const queuedEvent = emitter.formEvent(newEvent.type, newEvent.data);
    await this.queue.enqueue(queuedEvent.toolid, queuedEvent);
    await emitter.emitFormedEvent(queuedEvent);
  }
}
