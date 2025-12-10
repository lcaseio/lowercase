import type {
  DispatchInternalFx,
  EngineEffect,
  Planner,
  PlannerArgs,
  StartParallelMsg,
  StepReadyToStartMsg,
} from "../engine.types.js";

export const startParallelPlanner: Planner<StartParallelMsg> = (
  args: PlannerArgs<StartParallelMsg>
) => {
  const { newState, message } = args;
  const { runId, stepId } = message;

  const stepDef = newState.runs[runId].definition.steps[stepId];

  if (stepDef.type !== "parallel") return;

  const effects: EngineEffect[] = [];
  for (const step of stepDef.steps) {
    const effect = {
      kind: "DispatchInternal",
      message: {
        type: "StepReadyToStart",
        runId,
        stepId: step,
      } satisfies StepReadyToStartMsg,
    } satisfies DispatchInternalFx;
    effects.push(effect);
  }
  return effects;
};
