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
      activeToolCount: {},
      delayedJobs: {},
      jobTool: {
        [jobId]: toolId,
      },
    });

    const tool = (draft.runtime.perTool[toolId] ??= {
      activeJobCount: 0,
      inFlight: {},
      queue: {
        ready: [],
        delayed: [{ jobId }],
      },
    });

    // delay if worker exists for tool
    if (!draft.registry.tools[toolId].hasOnlineWorker) {
      tool.queue.delayed.push({
        jobId,
      });
      run.delayedJobs[jobId] = {
        reason: "Delayed due to no online workers.",
        since: event.time,
        toolId,
      };
    }
    // queue or delay job
    else if (
      tool.activeJobCount < draft.registry.tools[toolId].maxConcurrency
    ) {
      tool.inFlight[event.jobid] = {
        runId,
        startedAt: event.time,
      };
      const active = Object.keys(draft.runtime.perTool[toolId].inFlight).length;
      tool.activeJobCount = active;
      tool.queue.ready.push(event.jobid);
      run.activeToolCount[toolId] = (run.activeToolCount[toolId] ?? 0) + 1;
    } else {
      tool.queue.delayed.push({ jobId });
      run.delayedJobs[jobId] = {
        reason: "Delayed due to concurrency limit.",
        since: event.time,
        toolId,
      };
    }
  });
}
