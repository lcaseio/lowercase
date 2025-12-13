import type { EventStorePort } from "@lcase/ports/event-store";
import type { ReplayEnginePort } from "@lcase/ports/replay";
import type { EventBusPort } from "@lcase/ports";
export class ReplayEngine implements ReplayEnginePort {
  constructor(
    private readonly store: EventStorePort,
    private readonly bus: EventBusPort
  ) {}

  async replayAllEvents(runId: string) {
    for await (const event of this.store.iterateAllEvents(runId)) {
      await this.bus.publish(event.type, event);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10);
      });
    }
  }
}
