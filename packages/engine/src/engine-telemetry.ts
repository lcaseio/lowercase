import { EmitterFactoryPort, FlowQueuedParsed } from "@lcase/ports";
import { EngineTelemetryPort } from "@lcase/ports/engine";
import { FlowContext, RunContext } from "@lcase/types/engine";
import { AnyEvent, FlowEvent, FlowEventType } from "@lcase/types";

export type EngineTelContext = {
  traceId: string;
};
type thing = {
  flowid: string;
  traceid: string;
  flowname: string;
  flowversion: string;
};
export class EngineTelemetry implements EngineTelemetryPort {
  ctx = new Map<string, EngineTelContext>();
  constructor(private readonly ef: EmitterFactoryPort) {}

  async flowStarted(event: FlowEvent<FlowEventType>): Promise<void> {
    const emitter = this.ef.newFlowEmitterNewSpan(
      {
        flowid: event.flowid,
        source: "lowercase://engine",
      },
      event.traceid
    );
    await emitter.emit("flow.started", {
      flow: event.data.flow,
    });
  }

  async runStarted(runCtx: RunContext) {
    const emitter = this.ef.newRunEmitterNewSpan({
      source: "lowercase://engine",
      flowid: runCtx.flowId,
      runid: runCtx.runId,
      traceid: this.getTraceId(runCtx),
    });

    await emitter.emit("run.started", {
      run: {
        id: runCtx.runId,
        status: runCtx.status,
      },
      engine: {
        id: "",
      },
      status: "started",
    });
  }

  getTraceId(runCtx: RunContext) {
    if (!this.ctx.get(runCtx.runId)) {
      const traceId = this.ef.generateTraceId();
      this.ctx.set(runCtx.runId, { traceId });
      return traceId;
    } else {
      const telCtx = this.ctx.get(runCtx.runId)!;
      return telCtx.traceId;
    }
  }
  setTraceId(runId: string, traceId: string) {
    this.ctx.set(runId, { traceId });
  }

  flowQueuedFailed(flowQueuedParse: FlowQueuedParsed): Promise<void> {
    throw new Error("not yet implemented");
  }
}
