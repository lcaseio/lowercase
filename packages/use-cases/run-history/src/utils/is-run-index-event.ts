import type { AnyEvent } from "@lcase/types";

type RunIndexEventType =
  | "run.requested"
  | "run.started"
  | "run.completed"
  | "run.failed"
  | "step.reused"
  | "step.started"
  | "step.completed"
  | "step.failed";

export type RunIndexEvent = AnyEvent<RunIndexEventType>;

const eventTypes = new Set([
  "run.requested",
  "run.started",
  "run.completed",
  "run.failed",
  "step.reused",
  "step.started",
  "step.completed",
  "step.failed",
]);

/**
 * Looks at the event type of the supplied event, and sees if its a member
 * of the set of events that are relevant to building a RunIndex.  If it is,
 * returns true, and narrows the event type to a RunIndexEvent.
 * @param event AnyEvent
 * @returns boolean
 */
export function isRunIndexEvent(event: AnyEvent): event is RunIndexEvent {
  return eventTypes.has(event.type);
}
