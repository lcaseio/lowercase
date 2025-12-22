import { produce } from "immer";
import type { RmState } from "../resource-manager.js";
import type { JobSubmittedMsg } from "../rm.types.js";

export function jobSubmittedReducer(state: RmState, message: JobSubmittedMsg) {
  return produce(state, (draft) => {
    const { event } = message;
    const runId = event.runid;
    const jobId = event.jobid;

    // resolve tool
    const toolId =
      event.data.job.toolid ?? state.policy.defaultToolMap[event.capid];

    const run = (draft.runtime.perRun[runId] ??= {
      activeJobsPerToolCount: {},
      delayed: {},
      jobToolMap: { [jobId]: toolId },
      pendingDelayed: {},
      pendingDelayedCount: 0,
      pendingQueued: {},
      pendingQueuedCount: 0,
      queued: {},
    });

    const tool = (draft.runtime.perTool[toolId] ??= {
      activeJobCount: 0,
      delayed: {},
      pendingDelayed: {},
      pendingDelayedCount: 0,
      pendingQueued: {},
      pendingQueuedCount: 0,
      queued: {},
    });

    const jobEntry = { capId: event.capid, jobId, runId, toolId };

    // delay if worker exists for tool
    if (!draft.registry.tools[toolId].hasOnlineWorker) {
      tool.activeJobCount++;

      tool.pendingDelayed[jobId] = jobEntry;
      tool.pendingDelayedCount++;

      run.pendingDelayed[jobId] = jobEntry;
      run.pendingDelayedCount++;

      run.jobToolMap[jobId] = toolId;
      run.activeJobsPerToolCount[toolId] =
        (run.activeJobsPerToolCount[toolId] ?? 0) + 1;
    }
    // queue or delay job
    else if (
      tool.activeJobCount < draft.registry.tools[toolId].maxConcurrency
    ) {
      tool.activeJobCount++;
      tool.pendingQueued[jobId] = jobEntry;
      tool.pendingQueuedCount++;

      run.jobToolMap[jobId] = toolId;
      run.pendingQueued[jobId] = jobEntry;
      run.pendingQueuedCount++;
      run.activeJobsPerToolCount[toolId] =
        (run.activeJobsPerToolCount[toolId] ?? 0) + 1;
    } else {
      tool.pendingDelayed[jobId] = jobEntry;
      tool.pendingDelayedCount++;

      run.jobToolMap[jobId] = toolId;
      run.pendingDelayed[jobId] = jobEntry;
      run.pendingDelayedCount++;
    }
  });
}
