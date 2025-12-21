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

    if (!tool) return;
    if (tool.activeJobCount === 0 || !tool.inFlight[jobId]) return;
    if (!run) return;
    if (run.activeToolCount[toolId] === 0 || run.jobTool[jobId] !== toolId) {
      return;
    }
    delete tool.inFlight[jobId];
    tool.activeJobCount--;

    delete run.jobTool[jobId];
    run.activeToolCount[toolId]--;

    // queue a delayed job if a worker is online
    if (!draft.registry.tools[toolId].hasOnlineWorker) return;
    if (tool.queue.delayed.length === 0) return;

    const delayedJob = tool.queue.delayed.shift();
    if (!delayedJob) return;

    const delayedRun = draft.runtime.perRun[delayedJob.runId];
    delete delayedRun.delayedJobs[delayedJob.jobId];

    delayedRun.jobTool[delayedJob.jobId] = toolId;
    delayedRun.activeToolCount[toolId] =
      (delayedRun.activeToolCount[toolId] ?? 0) + 1;

    tool.queue.ready.push(delayedJob.jobId);
    tool.inFlight[delayedJob.jobId] = {
      runId: delayedJob.runId,
      startedAt: "",
    };

    tool.activeJobCount++;
  });
};
