import type { AnyEvent, ToolSpec } from "@lcase/types";
export type ToolQueueEntry = {
  workerId: string;
  runId: string;
  jobId: string;
  traceId: string;
};

export type ConcurrencyResult = ToolQueueEntry & {
  granted: boolean;
};
export interface ConcurrencyLimiterPort {
  slotRequestResults(event: AnyEvent): ConcurrencyResult[];
  slotFinishedResults(event: AnyEvent): ConcurrencyResult[];
  loadConfig(toolSpecs: ToolSpec[]): void;
}
