import type { FlowEvent, FlowEventType } from "@lcase/types";
import type { RunContext } from "@lcase/types";
import type { FlowQueuedParsed } from "../events/flow-parser.port.js";

export interface EngineTelemetryPort {
  flowStarted(event: FlowEvent<FlowEventType>): Promise<void>;
  flowQueuedFailed(flowQueuedParse: FlowQueuedParsed): Promise<void>;
  runStarted(runCtx: RunContext): Promise<void>;
  // getTraceId(event: AnyEvent, runCtx: RunContext): void;
}
