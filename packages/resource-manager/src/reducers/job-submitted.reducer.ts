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
      delayedArray: [],
      jobToolMap: { [jobId]: toolId },
      pendingDelayed: {},
      pendingQueued: {},
      queued: {},
      queuedArray: [],
    });

    const tool = (draft.runtime.perTool[toolId] ??= {
      activeJobCount: 0,
      delayed: {},
      delayedArray: [],
      pendingDelayed: {},
      pendingQueued: {},
      queued: {},
      queuedArray: [],
      toBeDelayed: null,
      toBeQueued: null,
    });

    const jobEntry = { capId: event.capid, jobId, runId, toolId };

    // delay if worker exists for tool
    if (!draft.registry.tools[toolId].hasOnlineWorker) {
      tool.activeJobCount++;
      tool.toBeDelayed = jobId;
      tool.toBeQueued = null;

      tool.pendingDelayed[jobId] = jobEntry;

      run.pendingDelayed[jobId] = jobEntry;
      run.jobToolMap[jobId] = toolId;
      run.activeJobsPerToolCount[toolId] =
        (run.activeJobsPerToolCount[toolId] ?? 0) + 1;
    }
    // queue or delay job
    else if (
      tool.activeJobCount < draft.registry.tools[toolId].maxConcurrency
    ) {
      tool.activeJobCount++;
      tool.toBeQueued = jobId;
      tool.toBeDelayed = null;
      tool.pendingQueued[jobId] = jobEntry;

      run.jobToolMap[jobId] = toolId;
      run.pendingQueued[jobId] = jobEntry;
      run.activeJobsPerToolCount[toolId] =
        (run.activeJobsPerToolCount[toolId] ?? 0) + 1;
    } else {
      tool.toBeDelayed = jobId;
      tool.toBeQueued = null;
      tool.pendingDelayed[jobId] = jobEntry;

      run.jobToolMap[jobId] = toolId;
      run.pendingDelayed[jobId] = jobEntry;
    }
  });
}
