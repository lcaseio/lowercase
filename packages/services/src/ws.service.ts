import { EventBusPort, WsServicePort } from "@lcase/ports";
import { hasRunId } from "@lcase/run-history";
import { AnyEvent } from "@lcase/types";

export class WsService implements WsServicePort {
  monitoredRuns = new Map<string, WebSocket>();

  constructor(private readonly bus: EventBusPort) {}

  async start() {
    this.bus.subscribe("*", async (e) => {
      await this.emit(e);
    });
  }

  async emit(e: AnyEvent) {
    if (!hasRunId(e) || !this.monitoredRuns.has(e.runid)) return;
    const sock = this.monitoredRuns.get(e.runid)!;

    try {
      const json = JSON.stringify(e);
      sock.send(json);
      if (e.type === "run.completed" || e.type === "run.failed") {
        this.monitoredRuns.delete(e.runid);
      }
    } catch (err) {
      console.error(`Error sending ${e} over socket: ${err}`);
    }
  }

  monitorRun(runId: string, socket: WebSocket) {
    this.monitoredRuns.set(runId, socket);
  }
  stopMonitoringRun(runId: string) {
    if (this.monitoredRuns.has(runId)) this.monitoredRuns.delete(runId);
  }
}
