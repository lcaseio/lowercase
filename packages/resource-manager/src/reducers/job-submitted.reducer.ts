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

    draft.runtime.perRun[runId] ??= {
      activeJobsByToolIdCount: {},
      delayedJobs: {},
      jobTool: {
        [jobId]: toolId,
      },
    };

    draft.runtime.perRun[event.runid].jobTool[event.jobid] = toolId;

    // delay if worker exists for tool
    if (!draft.registry.tools[toolId].hasOnlineWorker) {
      draft.runtime.perTool[toolId].queue.delayed.push({
        jobId,
      });
      draft.runtime.perRun[event.runid].delayedJobs[jobId] = {
        reason: "Delayed due to no online workers.",
        since: event.time,
        toolId,
      };
    }
    // queue or delay job
    else if (
      draft.runtime.perTool[toolId].activeJobCount <
      draft.registry.tools[toolId].maxConcurrency
    ) {
      draft.runtime.perTool[toolId].inFlight[event.jobid] = {
        runId,
        startedAt: event.time,
      };
      const active = Object.keys(draft.runtime.perTool[toolId].inFlight).length;
      draft.runtime.perTool[toolId].activeJobCount = active;
      draft.runtime.perTool[toolId].queue.ready.push(event.jobid);
      draft.runtime.perRun[runId].activeJobsByToolIdCount[toolId] ??= 0;
      draft.runtime.perRun[runId].activeJobsByToolIdCount[toolId]++;
    } else {
      draft.runtime.perTool[toolId].queue.delayed.push({ jobId });
      draft.runtime.perRun[runId].delayedJobs[jobId] = {
        reason: "Delayed due to concurrency limit.",
        since: event.time,
        toolId,
      };
    }
  });
}
