import { AnyEvent } from "@lcase/types";

export interface ThrottlerPort {
  handleToolRequested(event: AnyEvent): Promise<void>;
  start(): void;
  stop(): void;
}
