import type { EngineEffect, EngineState, Planner } from "../engine.types.js";
import type { StepPlannedMsg } from "../message.types.js";

export const stepPlannedPlanner: Planner<StepPlannedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: StepPlannedMsg
) => {
  const effects: EngineEffect[] = [];

  // see if old state was planned
  // see if new state is started
  // form step.started effect
  // form job.started effect
  //
  return effects;
};
