import type { RmState } from "../resource-manager.js";
import type {
  DelayJobFx,
  JobSubmittedMsg,
  QueueJobFx,
  RmEffect,
  RmPlanner,
} from "../rm.types.js";

export const jobSubmittedPlanner: RmPlanner<JobSubmittedMsg> = (
  oldState: RmState,
  newState: RmState,
  message: JobSubmittedMsg
): RmEffect[] => {
  const effects: RmEffect[] = [];
  const runId = message.event.runid;
  const jobId = message.event.jobid;

  const newRun = newState.runtime.perRun[runId];

  const toolId = newRun.jobTool[jobId];

  const oldToolState = oldState.runtime.perTool[toolId];
  const newToolState = newState.runtime.perTool[toolId];

  if (oldToolState.queue.ready.length < newToolState.queue.ready.length) {
    const queueJobFx = {
      type: "QueueJob",
      toolId,
      event: message.event,
    } satisfies QueueJobFx;

    effects.push(queueJobFx);
  } else if (
    oldToolState.queue.delayed.length < newToolState.queue.delayed.length
  ) {
    const delayJobFx = {
      type: "DelayJob",
      event: message.event,
    } satisfies DelayJobFx;
    effects.push(delayJobFx);
  }

  return effects;
};
