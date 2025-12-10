import {
  EngineState,
  Patch,
  Reducer,
  StepReadyToStartMsg,
} from "../engine.types.js";

export const stepReadyToStartReducer: Reducer<StepReadyToStartMsg> = (
  state: EngineState,
  message: StepReadyToStartMsg
): Patch | void => {
  const run = { ...state.runs[message.runId] };

  if (run.status === "pending") {
    run.status = "started";
  }
  return { runs: { [message.runId]: { ...run } } };
};
