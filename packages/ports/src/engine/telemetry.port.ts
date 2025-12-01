import type { AnyEvent } from "@lcase/types";
import type { RunContext } from "@lcase/types/engine";

export interface EngineTelemetryPort {
  flowStarted(event: AnyEvent, runCtx: RunContext): Promise<void>;
  getTraceId(event: AnyEvent, runCtx: RunContext): void;
}
