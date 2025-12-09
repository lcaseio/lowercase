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
};
