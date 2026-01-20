import { EventSink } from "@lcase/ports";
import { EventStorePort } from "@lcase/ports/event-store";
import { AnyEvent } from "@lcase/types";

export class ReplaySink implements EventSink {
  id = "replay-sink";
  #enableSink = false;
  constructor(private readonly store: EventStorePort) {}
  async start(): Promise<void> {
    this.#enableSink = true;
  }
  async stop(): Promise<void> {
    this.#enableSink = false;
  }
  handle(event: AnyEvent): Promise<void> | void {
    if (this.#enableSink === true) this.store.recordEvent(event);
  }
}
