import type { AnyEvent, RunIndex } from "@lcase/types";
import { hasRunId } from "./utils/has-run-id.js";
import {
  processRunFinished,
  processRunRequested,
  processRunStarted,
  processStepFinished,
  processStepReused,
  processStepStarted,
} from "./utils/process.js";
import { initRunIndex } from "./init-run-index.js";

/**
 * Updates a RunIndex object given a certain event.
 *
 * If the RunIndex object is undefined, it will attempt to create it
 * from the event provided.  Otherwise it will mutate + return the index.
 * If the event supplies is not relevant, returns the original index supplied
 * without changes.
 *
 * This behavior is a bit odd for the function name but it works in the
 * observability sink, and streamlines some behavior.  Probably think about
 * refactoring this to be clearer about what actually gets mutated/returned.
 *
 * But its designed to be flexible for undefined index values and add
 * information to an index by events, even if the events are out of order.
 *
 * Invokes a few utility functions that apply very simple granular edits
 * to the RunIndex.  Easier just to mutate in place, but unsure if it should
 * work this way.
 * @param event AnyEvent in the event system
 * @param index A RunIndex object, optional
 * @returns RunIndex or undefined
 */
export function updateRunIndex(
  event: AnyEvent,
  index?: RunIndex,
): RunIndex | undefined {
  if (!hasRunId(event)) return index;
  index ??= initRunIndex(event);
  if (!index) return;
  switch (event.type) {
    case "run.requested":
      processRunRequested(event as AnyEvent<"run.requested">, index);
      break;
    case "run.started":
      processRunStarted(event as AnyEvent<"run.started">, index);
      break;
    case "run.completed":
      processRunFinished(event as AnyEvent<"run.completed">, index);
      break;
    case "run.failed":
      processRunFinished(event as AnyEvent<"run.failed">, index);
      break;
    case "step.reused":
      processStepReused(event as AnyEvent<"step.reused">, index);
      break;
    case "step.started":
      processStepStarted(event as AnyEvent<"step.started">, index);
      break;
    case "step.completed":
      processStepFinished(event as AnyEvent<"step.completed">, index);
      break;
    case "step.failed":
      processStepFinished(event as AnyEvent<"step.failed">, index);
      break;
    default:
      break;
  }
  return index;
}
