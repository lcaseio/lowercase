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

  const newRunState = newState.runtime.perRun[runId];

  const toolId = newRunState.jobToolMap[jobId];

  const newToolState = newState.runtime.perTool[toolId];

  if (newToolState.toBeQueued === jobId) {
    // queue something
    const queueJobFx = {
      type: "QueueJob",
      toolId,
      event: message.event,
    } satisfies QueueJobFx;
    effects.push(queueJobFx);
  } else if ((newToolState.toBeDelayed = jobId)) {
    // delay something
    const delayJobFx = {
      type: "DelayJob",
      event: message.event,
    } satisfies DelayJobFx;
    effects.push(delayJobFx);
  }

  return effects;
};
