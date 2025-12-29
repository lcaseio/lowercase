import { AnyEvent } from "@lcase/types";

export interface ConcurrencyLimiterPort {
  handleToolRequested(event: AnyEvent): Promise<void>;
  start(): void;
  stop(): void;
}
