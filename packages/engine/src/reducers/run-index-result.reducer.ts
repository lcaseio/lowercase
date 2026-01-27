import { produce } from "immer";
import type { EngineState, Reducer } from "../engine.types.js";
import type { RunIndexResultMsg } from "../types/message.types.js";

export const runIndexResultReducer: Reducer<RunIndexResultMsg> = (
  state: EngineState,
  message: RunIndexResultMsg,
) => {
  return produce(state, (draft) => {
    const { runId } = message;
    const run = draft.runs[runId];

    if (!run) return;
    if (!message.ok) {
      run.status = "failed";
      return;
    }

    run.runIndex = message.runIndex;
  });
};
