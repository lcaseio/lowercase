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
  return { runs: { [message.runId]: { ...run, status: "started" } } };
};
