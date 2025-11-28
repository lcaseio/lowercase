import type { AnyEvent, EventType } from "@lcase/types";
import {
  EventSchemaRegistry,
  eventRegistry,
} from "../registries/event-registry.js";
import { EventParserPort } from "@lcase/ports";

export class EventParser implements EventParserPort {
  constructor(registry: EventSchemaRegistry) {}
  parse<T extends EventType>(event: AnyEvent, type: T): AnyEvent<T> {
    const eventSchema = eventRegistry[type].schema.event;

    const result = eventSchema.safeParse(event);
    if (result.error) throw new Error(JSON.stringify(result.error, null, 2));

    return result.data as AnyEvent<T>;
  }
}
