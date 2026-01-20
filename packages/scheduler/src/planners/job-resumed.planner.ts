import type { SchedulerState } from "../scheduler.state.type.js";
import type {
  JobResumedMsg,
  QueueJobFx,
  SchedulerEffect,
  SchedulerPlanner,
} from "../scheduler.types.js";

export const jobResumedPlanner: SchedulerPlanner<JobResumedMsg> = (
  oldState: SchedulerState,
  newState: SchedulerState,
  message: JobResumedMsg
): SchedulerEffect[] => {
  const effects: SchedulerEffect[] = [];
  const toolId = message.event.data.job.toolid;
  const oldToolState = oldState.runtime.perTool[toolId];
  const newToolState = newState.runtime.perTool[toolId];

  if (oldToolState.pendingQueuedCount < newToolState.pendingQueuedCount) {
    const queueJobFx: QueueJobFx = {
      type: "QueueJob",
      toolId: toolId,
      event: message.event,
    };
    effects.push(queueJobFx);
  }
  return effects;
};
