import {
  EngineState,
  Patch,
  Reducer,
  StartParallelMsg,
} from "../engine.types.js";

export const startParallelReducer: Reducer<StartParallelMsg> = (
  state: EngineState,
  message: StartParallelMsg
): Patch | void => {
  const { runId, stepId } = message;
  const run = state.runs[runId];
  const stepDef = run.definition.steps[stepId];

  if (stepDef.type !== "parallel") return;

  const steps = stepDef.steps;

  for (const step of steps) {
  }
  return;
};
