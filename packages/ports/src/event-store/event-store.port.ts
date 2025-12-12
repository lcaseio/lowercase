import { AnyEvent } from "@lcase/types";

export interface EventStorePort {
  recordEvent(event: AnyEvent): Promise<boolean | undefined>;
  getEvent(eventId: string): Promise<AnyEvent>;
  iterateAllEvents(runId: string): AsyncGenerator<AnyEvent>;
}
