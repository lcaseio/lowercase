import { AnyEvent } from "@lcase/types";
import { SlotAccessDecision } from "../concurrency-limiter/concurrency-limiter.port.js";

export interface LimiterPort {
  handleSlotRequested(event: AnyEvent): Promise<void>;
  handleSlotFinished(event: AnyEvent): Promise<void>;
  emitResponse(decision: SlotAccessDecision, toolId: string): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}
