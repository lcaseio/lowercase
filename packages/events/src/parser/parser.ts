import type { AnyEvent, EventType } from "@lcase/types";
import { registry } from "../event-registry.js";

export function eventParser<T extends EventType>(
  event: AnyEvent,
  type: T
): AnyEvent<T> {
  const eventSchema = registry[type].schema.event;

  const result = eventSchema.safeParse(event);
  if (result.error) throw new Error(JSON.stringify(result.error, null, 2));

  return result.data as AnyEvent<T>;
}
