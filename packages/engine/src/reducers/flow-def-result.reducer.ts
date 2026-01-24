import { produce } from "immer";
import { EngineState, Reducer } from "../engine.types.js";
import { FlowDefResultMsg } from "../types/message.types.js";

export const flowDefResultReducer: Reducer<FlowDefResultMsg> = (
  state: EngineState,
  message: FlowDefResultMsg,
) => {
  return produce(state, (draft) => {
    const runId = message.runId;
    const run = draft.runs[runId];

    if (!run) return;
    if (!message.ok) {
      run.status = "failed";
      return;
    }

    // store flow definition in memory by hash (flowId)
    draft.flows[run.flowDefHash].definition = message.def;
    draft.flows[run.flowDefHash].runIds[runId] = true;
  });
};
