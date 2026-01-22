import { RunIndexEvent } from "@lcase/ports";
import { AnyEvent } from "@lcase/types";

const eventTypes = new Set([
  "run.requested",
  "run.started",
  "run.completed",
  "run.failed",
  "step.started",
  "step.completed",
  "step.failed",
]);

export function isRunIndexEvent(event: AnyEvent): event is RunIndexEvent {
  return eventTypes.has(event.type);
}
