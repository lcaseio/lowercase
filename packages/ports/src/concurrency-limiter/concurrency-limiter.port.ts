import type { AnyEvent, ToolSpec } from "@lcase/types";
export type ToolQueueEntry = {
  workerId: string;
  runId: string;
  jobId: string;
  traceId: string;
};

export type SlotAccessDecision = ToolQueueEntry & {
  granted: boolean;
};
export interface ConcurrencyLimiterPort {
  slotRequestDecisions(event: AnyEvent): SlotAccessDecision[];
  slotFinishedDecisions(event: AnyEvent): SlotAccessDecision[];
  loadConfig(toolSpecs: ToolSpec[]): void;
}
