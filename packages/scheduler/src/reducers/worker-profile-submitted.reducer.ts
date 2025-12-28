import { produce } from "immer";
import type {
  SchedulerReducer,
  WorkerProfileSubmittedMsg,
} from "../scheduler.types.js";
import type { SchedulerState } from "../scheduler.state.type.js";

export const workerProfileSubmittedReducer: SchedulerReducer<
  WorkerProfileSubmittedMsg
> = (state: SchedulerState, message: WorkerProfileSubmittedMsg) => {
  return produce(state, (draft) => {
    const { event } = message;
    const workers = draft.registry.workers;
    const workerId = event.data.id;
    const tools = draft.registry.tools;

    workers[workerId] ??= {
      canRunTools: {},
      name: event.data.name,
      status: "online",
      type: event.data.type,
    };

    workers[workerId].canRunTools = {};
    for (const tool of event.data.tools) {
      workers[workerId].canRunTools[tool] = true;
      tools[tool].hasOnlineWorker = true;
    }
  });
};
