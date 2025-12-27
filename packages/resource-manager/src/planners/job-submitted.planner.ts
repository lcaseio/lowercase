import type { RmState } from "../rm.state.type.js";
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

  const oldToolState = oldState.runtime.perTool[toolId];
  const newToolState = newState.runtime.perTool[toolId];

  const oldPendingQueuedCount = oldToolState
    ? oldToolState.pendingQueuedCount
    : 0;
  const oldPendingDelayedCount = oldToolState
    ? oldToolState.pendingDelayedCount
    : 0;

  // attempt to queue this job
  if (newToolState.pendingQueuedCount > oldPendingQueuedCount) {
    const queueJobFx = {
      type: "QueueJob",
      toolId,
      event: message.event,
    } satisfies QueueJobFx;
    effects.push(queueJobFx);
  }
  // attempt to delay this job
  else if (newToolState.pendingDelayedCount > oldPendingDelayedCount) {
    // delay something
    const delayJobFx = {
      type: "DelayJob",
      toolId,
      event: message.event,
    } satisfies DelayJobFx;
    effects.push(delayJobFx);
  }

  return effects;
};
