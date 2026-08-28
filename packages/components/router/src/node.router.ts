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
    private readonly ef: EmitterFactory,
  ) {}
  async route(event: AnyEvent): Promise<void> {
    if (!event.type.endsWith(".submitted") && !event.type.startsWith("job.")) {
      return;
    }
    // Worker V2 plan Phase 4: the engine now calls Worker V2 directly for
    // httpjson (packages/integrations' engine-worker subpath), bypassing the
    // router/queue entirely -- job.httpjson.submitted still publishes (kept
    // for observability), but nothing consumes job.httpjson.queued anymore.
    // Queueing it here would let a still-running legacy consumer execute the
    // same job a second time. Temporary, same as the legacy consumer itself:
    // Phase 5 removes this guard along with the rest of the queue path.
    const jobSubmittedEvent = event as JobSubmittedEvent;
    if (jobSubmittedEvent.capid === "httpjson") return;
    await this.queueJob(jobSubmittedEvent);
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
