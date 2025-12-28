import { produce } from "immer";
import type { SchedulerState } from "../scheduler.state.type.js";
import { JobDequeuedMsg, SchedulerReducer } from "../scheduler.types.js";

export const jobDequeuedReducer: SchedulerReducer<JobDequeuedMsg> = (
  state: SchedulerState,
  message: JobDequeuedMsg
): SchedulerState => {
  return produce(state, (draft) => {
    const { jobId, toolId, runId } = message.event.data;
    const tool = draft.runtime.perTool[toolId];
    const run = draft.runtime.perRun[runId];

    if (!tool) return;
    if (!run) return;

    // check and see if theres a job in queued, then delete it
    if (tool.queued[jobId] !== undefined) {
      const jobEntry1 = tool.queued[jobId];
      delete tool.queued[jobId];
      tool.running[jobId] = jobEntry1;
    }
    if (run.queued[jobId] !== undefined) {
      const jobEntry2 = run.queued[jobId];
      delete run.queued[jobId];
      run.running[jobId] = jobEntry2;
    }

    // later check and see if its also in pending,
    // somehow mark start as already consumed, and check that when
    // queued event comes back
  });
};
