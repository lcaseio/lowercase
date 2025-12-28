import type { SchedulerState } from "../scheduler.state.type.js";
import type {
  DelayJobFx,
  JobSubmittedMsg,
  QueueJobFx,
  SchedulerEffect,
  SchedulerPlanner,
} from "../scheduler.types.js";

export const jobSubmittedPlanner: SchedulerPlanner<JobSubmittedMsg> = (
  oldState: SchedulerState,
  newState: SchedulerState,
  message: JobSubmittedMsg
): SchedulerEffect[] => {
  const effects: SchedulerEffect[] = [];
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
