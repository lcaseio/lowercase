import type { EngineEffect, EngineState, Planner } from "../engine.types.js";
import { MakeRunPlanFx } from "../types/effect.types.js";
import type { RunIndexResultMsg } from "../types/message.types.js";

export const runIndexResultPlanner: Planner<RunIndexResultMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: RunIndexResultMsg,
) => {
  const effects: EngineEffect[] = [];
  const runId = message.runId;
  const newRunState = newState.runs[runId];

  console.log("we got here at least on the planner");
  if (!newRunState) return effects;
  console.log("we have a runstate for run index result planner");

  if (newRunState.status === "failed") {
    // emit run error
    console.log("run index result planner failed status");
    return effects;
  }

  console.log("planner asking for make run plan fx");
  const fx: MakeRunPlanFx = {
    type: "MakeRunPlan",
    runId,
  };
  effects.push(fx);
  return effects;
};
