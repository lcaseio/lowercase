import { produce } from "immer";
import type { SchedulerState } from "../scheduler.state.type.js";
import { JobDelayedMsg, SchedulerReducer } from "../scheduler.types.js";

export const jobDelayedReducer: SchedulerReducer<JobDelayedMsg> = (
  state: SchedulerState,
  message: JobDelayedMsg
): SchedulerState => {
  return produce(state, (draft) => {
    const runId = message.event.runid;
    const toolId = message.event.data.job.toolid;
    const jobId = message.event.jobid;

    const run = draft.runtime.perRun[runId];
    const tool = draft.runtime.perTool[toolId];

    if (!run || run.pendingDelayed[jobId] === undefined) return;
    if (!tool || tool.pendingDelayed[jobId] === undefined) return;

    const pendingRunJobEntry = run.pendingDelayed[jobId];
    delete run.pendingDelayed[jobId];
    run.delayed[jobId] = pendingRunJobEntry;
    run.pendingDelayedCount--;

    const pendingToolJobEntry = tool.pendingDelayed[jobId];
    delete tool.pendingDelayed[jobId];
    tool.delayed[jobId] = pendingToolJobEntry;
    tool.pendingDelayedCount--;
  });
};
