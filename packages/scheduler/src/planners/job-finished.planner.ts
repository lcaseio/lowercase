import type { SchedulerState } from "../scheduler.state.type.js";
import type {
  JobFinishedMsg,
  ResumeJobFx,
  SchedulerEffect,
  SchedulerPlanner,
} from "../scheduler.types.js";

export const jobFinishedPlanner: SchedulerPlanner<JobFinishedMsg> = (
  oldState: SchedulerState,
  newState: SchedulerState,
  message: JobFinishedMsg
): SchedulerEffect[] => {
  const effects: SchedulerEffect[] = [];

  const oldTool = oldState.runtime.perTool[message.event.data.job.toolid];
  const newTool = newState.runtime.perTool[message.event.data.job.toolid];
  const oldRun = oldState.runtime.perRun[message.event.runid];
  const newRun = newState.runtime.perRun[message.event.runid];

  if (!oldRun || !newRun) return effects;

  if (Object.keys(newTool.delayed).length === 0) return effects;
  if (newTool.activeJobCount !== oldTool.activeJobCount) return effects;

  const resumeJobFx: ResumeJobFx = {
    type: "ResumeJob",
    event: message.event,
  };
  effects.push(resumeJobFx);
  return effects;
};
