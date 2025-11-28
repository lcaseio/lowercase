import { AnyEvent, EventType } from "@lcase/types";

export interface EventParserPort {
  parse<T extends EventType>(event: AnyEvent, type: T): AnyEvent<T>;
}
