import type { AnyEvent } from "@lcase/types";
import type { RunIndex } from "@lcase/ports";
import { hasRunId } from "./utils/has-run-id.js";
import {
  processRunFinished,
  processRunRequested,
  processRunStarted,
  processStepFinished,
  processStepStarted,
} from "./utils/process.js";
import { initRunIndex } from "./init-run-index.js";

export function updateRunIndex(
  event: AnyEvent,
  index?: RunIndex,
): RunIndex | undefined {
  if (!hasRunId(event)) return;
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
