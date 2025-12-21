import { RmState } from "../resource-manager.js";
import { JobFinishedMsg, RmEffect, RmPlanner } from "../rm.types.js";

export const jobFinishedPlanner: RmPlanner<JobFinishedMsg> = (
  oldState: RmState,
  newState: RmState,
  message: JobFinishedMsg
): RmEffect[] => {
  const effects: RmEffect[] = [];

  const oldTool = oldState.runtime.perTool[message.event.data.job.toolid];
  const newTool = newState.runtime.perTool[message.event.data.job.toolid];
  const oldRun = oldState.runtime.perRun[message.event.runid];
  const newRun = newState.runtime.perRun[message.event.runid];

  if (!oldRun || !newRun) return effects;
  return effects;
};
