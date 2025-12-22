import { produce } from "immer";
import { JobQueuedMsg, RmReducer } from "../rm.types.js";
import { RmState } from "../resource-manager.js";

export const jobQueuedReducer: RmReducer<JobQueuedMsg> = (
  state: RmState,
  message: JobQueuedMsg
): RmState => {
  return produce(state, (draft) => {
    const runId = message.event.runid;
    const jobId = message.event.jobid;
    const toolId = message.event.data.job.toolid;

    const run = draft.runtime.perRun[runId];
    const tool = draft.runtime.perTool[toolId];

    // update state of a runtime from pending to queued

    if (!run || run.pendingQueued[jobId] === undefined) return;
    if (!tool || tool.pendingQueued[jobId] === undefined) return;

    const pendingRunJobEntry = run.pendingQueued[jobId];
    delete run.pendingQueued[jobId];
    run.pendingQueuedCount--;

    run.queued[jobId] = pendingRunJobEntry;

    const pendingToolJobEntry = tool.pendingQueued[jobId];
    delete tool.pendingQueued[jobId];
    tool.pendingQueuedCount--;

    tool.queued[jobId] = pendingToolJobEntry;
  });
};
