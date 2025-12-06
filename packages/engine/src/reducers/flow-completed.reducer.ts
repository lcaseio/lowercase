import type {
  EngineState,
  FlowCompletedMsg,
  Reducer,
} from "../engine.types.js";

export const flowCompletedReducer: Reducer<FlowCompletedMsg> = (
  state: EngineState,
  message: FlowCompletedMsg
) => {
  const { runId, stepId } = message;
  const run = state.runs[runId];
  const steps = state.runs[runId].steps;
  const stepCtx = steps[stepId];

  return;
};
