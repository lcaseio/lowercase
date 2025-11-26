import { EmitterFactory } from "@lcase/events";
import type { RouterPort, QueuePort, EventBusPort } from "@lcase/ports";
import type { AnyEvent, AnyJobEvent } from "@lcase/types";

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
    if (event === undefined || event.type === undefined) {
      console.error("[router] event or event type is undefined; event:", event);
      return;
    }
  }

  async start() {
    this.bus.subscribe("nothing", async (e) => await this.route(e));
  }
  async stop() {
    this.bus.close();
  }
}
