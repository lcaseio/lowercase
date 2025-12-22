import { produce } from "immer";
import { RmState } from "../resource-manager.js";
import { JobFinishedMsg, RmReducer } from "../rm.types.js";

/**
 * Updates active runtime state per tool and per job for a completed event
 * @param state RmState - current state
 * @param message JobCompletedMsg
 * @returns RmState - new state
 */
export const jobFinishedReducer: RmReducer<JobFinishedMsg> = (
  state: RmState,
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
    if (tool.activeJobCount === 0 || tool.queuedArray.length === 0) return;
    if (!run) return;
    if (
      run.activeJobsPerToolCount[toolId] === 0 ||
      run.jobToolMap[jobId] !== toolId
    ) {
      return;
    }
    delete tool.queued[jobId]; // could move to a completed or failed queue but not necessary
    tool.activeJobCount--;

    delete run.jobToolMap[jobId];
    run.activeJobsPerToolCount[toolId]--;
    delete run.queued[jobId];

    // queue a delayed job if a worker is online
    if (!draft.registry.tools[toolId].hasOnlineWorker) return;
    if (tool.delayedArray.length !== 0) return;

    const delayedJobId = tool.delayedArray[0];
    if (!delayedJobId) return;

    const delayedRun = draft.runtime.perRun[delayedJobId];
    const delayedJob = delayedRun.delayed[jobId];
    // if job is not delayed yet, it is still pending
    // recheck on resolving that pending if concurrency is available.
    if (!delayedJob) return;

    // otherwise go ahead and try to queue the delayed job
    tool.activeJobCount++;
    tool.toBeQueued = delayedJobId;
    tool.toBeDelayed = null;
    tool.pendingQueued[jobId] = delayedJob;

    delayedRun.pendingQueued[delayedJobId] = delayedJob;
    delayedRun.activeJobsPerToolCount[toolId] =
      (delayedRun.activeJobsPerToolCount[toolId] ?? 0) + 1;
    delayedRun.jobToolMap[delayedJobId] = toolId;
  });
};
