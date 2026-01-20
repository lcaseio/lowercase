import { produce } from "immer";
import type { SchedulerState } from "../scheduler.state.type.js";
import type { JobFinishedMsg, SchedulerReducer } from "../scheduler.types.js";

/**
 * Updates active runtime state per tool and per job for a completed event
 * @param state SchedulerState - current state
 * @param message JobCompletedMsg
 * @returns SchedulerState - new state
 */
export const jobFinishedReducer: SchedulerReducer<JobFinishedMsg> = (
  state: SchedulerState,
  message: JobFinishedMsg
) => {
  return produce(state, (draft) => {
    const toolId = message.event.data.job.toolid;
    const jobId = message.event.data.job.id;
    const runId = message.event.runid;

    const tool = draft.runtime.perTool[toolId];
    const run = draft.runtime.perRun[runId];

    // these things must exist in order for the system to work.
    // in the future, emit an error as a side effect somehow, with an
    // explanation of why this job event was not able to be processed
    if (!tool) return;
    if (!run) return;
    if (tool.activeJobCount === 0) return;

    if (
      run.activeJobsPerToolCount[toolId] === 0 ||
      run.jobToolMap[jobId] !== toolId
    ) {
      return;
    }

    if (tool.running[jobId] === undefined) return;
    if (run.running[jobId] === undefined) return;

    delete tool.running[jobId];
    tool.activeJobCount--;

    delete run.running[jobId];
    delete run.jobToolMap[jobId];
    run.activeJobsPerToolCount[toolId]--;

    // queue a delayed job if a worker is online
    if (!draft.registry.tools[toolId].hasOnlineWorker) return;
    if (Object.keys(tool.delayed).length === 0) return;

    tool.activeJobCount++;
  });
};
