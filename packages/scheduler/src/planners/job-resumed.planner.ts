import type { RmState } from "../rm.state.type.js";
import type {
  JobResumedMsg,
  QueueJobFx,
  RmEffect,
  RmPlanner,
} from "../rm.types.js";

export const jobResumedPlanner: RmPlanner<JobResumedMsg> = (
  oldState: RmState,
  newState: RmState,
  message: JobResumedMsg
): RmEffect[] => {
  const effects: RmEffect[] = [];
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
