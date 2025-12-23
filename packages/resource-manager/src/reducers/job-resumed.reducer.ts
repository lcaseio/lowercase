import { produce } from "immer";
import { RmState } from "../resource-manager.js";
import { JobResumedMsg, RmReducer } from "../rm.types.js";

export const jobResumedReducer: RmReducer<JobResumedMsg> = (
  state: RmState,
  message: JobResumedMsg
): RmState => {
  return produce(state, (draft) => {
    const toolId = message.event.data.job.toolid;
    const runId = message.event.runid;
    const jobId = message.event.jobid;

    const run = draft.runtime.perRun[runId];
    const tool = draft.runtime.perTool[toolId];

    if (!run) return;
    if (!tool) return;

    if (tool.delayed[jobId] !== undefined) {
      const jobEntry = tool.delayed[jobId];
      delete tool.delayed[jobId];
      tool.pendingQueued[jobId] = jobEntry;
      tool.pendingQueuedCount++;
    }
    if (run.delayed[jobId] !== undefined) {
      const jobEntry = run.delayed[jobId];
      delete run.delayed[jobId];
      run.pendingQueued[jobId] = jobEntry;
      run.pendingQueuedCount++;
    }
  });
};
