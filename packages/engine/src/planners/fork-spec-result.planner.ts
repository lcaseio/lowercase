import { EngineEffect, EngineState, Planner } from "../engine.types.js";
import { GetRunIndexFx } from "../types/effect.types.js";
import { ForkSpecResultMsg } from "../types/message.types.js";

export const forkSpecResultPlanner: Planner<ForkSpecResultMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: ForkSpecResultMsg,
) => {
  const effects: EngineEffect[] = [];
  const runId = message.runId;
  const newRunState = newState.runs[runId];

  if (!newRunState) return effects;

  if (newRunState.status === "failed") {
    // emit run.denied with error message
    return effects;
  }
  // if some analysis in the reducer says we don't need an index,
  // then go ahead an create a flow analysis

  const fx: GetRunIndexFx = {
    type: "GetRunIndex",
    runId,
  };
  effects.push(fx);

  return effects;
};
