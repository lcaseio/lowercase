import type { FlowEvent, FlowEventType } from "@lcase/types";
import type { FlowContext, RunContext } from "@lcase/types/engine";
import { FlowQueuedParsed } from "../events/flow-parser.port.js";

type thing = {
  flowid: string;
  traceid: string;
  flowname: string;
  flowversion: string;
};
export interface EngineTelemetryPort {
  flowStarted(event: FlowEvent<FlowEventType>): Promise<void>;
  flowQueuedFailed(flowQueuedParse: FlowQueuedParsed): Promise<void>;
  runStarted(runCtx: RunContext): Promise<void>;
  // getTraceId(event: AnyEvent, runCtx: RunContext): void;
}
