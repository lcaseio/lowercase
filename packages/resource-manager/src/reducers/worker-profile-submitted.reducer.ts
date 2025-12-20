import { produce } from "immer";
import { RmReducer, WorkerProfileSubmittedMsg } from "../rm.types.js";
import { RmState } from "../resource-manager.js";

export const workerProfileSubmittedReducer: RmReducer<
  WorkerProfileSubmittedMsg
> = (state: RmState, message: WorkerProfileSubmittedMsg) => {
  return produce(state, (draft) => {
    const { event } = message;
    const workers = draft.registry.workers;
    const workerId = event.data.id;
    const tools = draft.registry.tools;

    for (const tool of event.data.tools) {
      workers[workerId].canRunTools[tool] = true;
      workers[workerId].name = event.data.name;
      workers[workerId].status = "online";
      workers[workerId].type = event.data.type;

      tools[tool].hasOnlineWorker = true;
    }
  });
};
