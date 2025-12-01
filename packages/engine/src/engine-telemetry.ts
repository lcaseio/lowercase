import { EmitterFactoryPort } from "@lcase/ports";
import { EngineTelemetryPort } from "@lcase/ports/engine";
import { RunContext } from "@lcase/types/engine";
import { AnyEvent } from "@lcase/types";

export type EngineObservabilityContext = {
  traceId: string;
};

export class EngineTelemetry implements EngineTelemetryPort {
  ctx = new Map<string, EngineObservabilityContext>();
  constructor(private readonly ef: EmitterFactoryPort) {}

  async flowStarted(event: AnyEvent, runCtx: RunContext): Promise<void> {
    const traceId = this.getTraceId(event, runCtx);
    const emitter = this.ef.newFlowEmitterNewSpan(
      {
        flowid: runCtx.flowId,
        source: "lowercase://engine",
      },
      traceId
    );
    await emitter.emit("flow.started", {
      flow: {
        id: runCtx.flowId,
        name: runCtx.definition.name,
        version: runCtx.definition.version,
      },
    });
  }

  getTraceId(event: AnyEvent, runCtx: RunContext) {
    const obsCtx = this.ctx.get(runCtx.runId);
    return obsCtx?.traceId ? obsCtx.traceId : event.traceid;
  }
}
