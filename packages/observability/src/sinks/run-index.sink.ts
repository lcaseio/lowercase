import type { EventSink, RunIndexStorePort } from "@lcase/ports";
import type { AnyEvent, RunIndex } from "@lcase/types";
import { hasRunId, updateRunIndex } from "@lcase/run-history";

export class RunIndexSink implements EventSink {
  id = "run-index-sink";
  enableSink = true;
  runIndexMap = new Map<string, RunIndex>();
  constructor(private readonly store: RunIndexStorePort) {}
  async start(): Promise<void> {
    this.enableSink = true;
  }
  async stop(): Promise<void> {
    this.enableSink = false;
  }
  handle(event: AnyEvent): Promise<void> | void {
    if (this.enableSink === false) return;
    if (!hasRunId(event)) return;

    const index = updateRunIndex(event, this.runIndexMap.get(event.runid));
    if (index === undefined) return;
    this.runIndexMap.set(event.runid, index);

    if (event.type === "run.completed" || event.type === "run.failed") {
      this.store.putRunIndex(index, event.runid);
    }
  }
}
