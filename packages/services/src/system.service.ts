import type {
  EmitterFactoryPort,
  EnginePort,
  EventBusPort,
  EventSink,
  LimiterPort,
  ObservabilityTapPort,
  RouterPort,
  RuntimeStatus,
  SystemServicePort,
  WorkerPort,
} from "@lcase/ports";

export type SystemServiceDeps = {
  engine: EnginePort;
  limiter: LimiterPort;
  ef: EmitterFactoryPort;
  router: RouterPort;
  sinks: Record<string, EventSink>;
  tap: ObservabilityTapPort;
  worker: WorkerPort;
  bus: EventBusPort;
};
export class SystemService implements SystemServicePort {
  constructor(public readonly deps: SystemServiceDeps) {}

  async startSystem(): Promise<RuntimeStatus> {
    try {
      await this.deps.router.start();

      for (const sink of Object.values(this.deps.sinks)) {
        await sink.start();
      }
      this.deps.tap.start();

      await this.deps.engine.start();
      await this.deps.worker.start();
      await this.deps.limiter.start();

      return "running";
    } catch (err) {
      const traceId = this.deps.ef.generateTraceId();
      const spanId = this.deps.ef.generateSpanId();
      const traceParent = this.deps.ef.makeTraceParent(traceId, spanId);
      const systemEmitter = this.deps.ef.newSystemEmitter({
        source: "lowercase://runtime/workflow-runtime/start-runtime",
        traceId,
        spanId,
        traceParent,
      });
      systemEmitter.emit("system.logged", {
        log: "Error starting runtime: " + err,
      });

      return "stopped";
    }
  }

  async stopSystem(): Promise<RuntimeStatus> {
    try {
      await this.deps.engine.stop();
      await this.deps.worker.stopAllJobWaiters();

      for (const sink of Object.values(this.deps.sinks)) {
        await sink.stop();
      }

      this.deps.tap.stop();
      await this.deps.router.stop();
      await this.deps.bus.close();
      return "stopped";
    } catch (err) {
      console.error(`[workflow-runtime] error stopping runtime ${err}`);
    }
    return "running";
  }

  attachSink(sink: EventSink) {
    this.deps.tap.attachSink(sink);
  }
}
