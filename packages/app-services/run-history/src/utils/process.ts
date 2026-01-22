import { RunIndex } from "@lcase/ports";
import { AnyEvent } from "@lcase/types";
import { getDuration } from "./get-duration.js";

export function processRunRequested(
  event: AnyEvent<"run.requested">,
  index: RunIndex,
) {
  index.flowDefHash = event.data.flowDefHash;
  index.forkSpecHash = event.data.forkSpecHash;
}
export function processRunStarted(
  event: AnyEvent<"run.started">,
  index: RunIndex,
): void {
  index.startTime = event.time;
}

export function processRunFinished(
  event: AnyEvent<"run.completed"> | AnyEvent<"run.failed">,
  index: RunIndex,
): void {
  index.endTime = event.time;
  index.duration = getDuration(index.startTime, index.endTime);
}

export function processStepStarted(
  event: AnyEvent<"step.started">,
  index: RunIndex,
): void {
  index.steps[event.stepid] ??= {};
  index.steps[event.stepid].startTime = event.time;
  index.steps[event.stepid].status = event.data.status;
}

export function processStepFinished(
  event: AnyEvent<"step.completed"> | AnyEvent<"step.failed">,
  index: RunIndex,
): void {
  index.steps[event.stepid] ??= {};
  const step = index.steps[event.stepid];
  step.endTime = event.time;
  step.outputHash = event.data.outputHash;
  step.status = event.data.status;
  step.duration = getDuration(step.startTime, step.endTime);
}
