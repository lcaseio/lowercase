import type { EventSink, RunIndexStorePort } from "@lcase/ports";
import type { AnyEvent } from "@lcase/types";

export class RunIndexSink implements EventSink {
  id = "run-index-sink";
  enableSink = true;
  constructor(private readonly store: RunIndexStorePort) {}
  async start(): Promise<void> {
    this.enableSink = true;
  }
  async stop(): Promise<void> {
    this.enableSink = false;
  }
  handle(event: AnyEvent): Promise<void> | void {
    if (this.enableSink === true) this.store.processEvent(event);
  }
}
