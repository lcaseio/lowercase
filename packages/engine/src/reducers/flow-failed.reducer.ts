import { RunContext } from "@lcase/types/engine";
import type { EngineState, FlowFailedMsg, Reducer } from "../engine.types.js";

export const flowFailedReducer: Reducer<FlowFailedMsg> = (
  state: EngineState,
  message: FlowFailedMsg
) => {
  const { runId, stepId } = message;
  const run = state.runs[runId];
  const steps = state.runs[runId].steps;
  const stepCtx = steps[stepId];

  return;
};
