import { AnyEvent } from "@lcase/types";

export interface EventStore {
  recordEvent(event: AnyEvent): Promise<void>;
  getEvent(eventId: string): Promise<AnyEvent>;
  iterateAllEvents(runId: string): AsyncGenerator<AnyEvent>;
}
