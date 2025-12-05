import {
  Planner,
  EngineEffect,
  EngineState,
  JobCompletedMsg,
} from "../engine.js";

export const jobCompletedPlanner: Planner<JobCompletedMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: JobCompletedMsg;
}): EngineEffect[] | void => {
  const { newState, message } = args;
  const { runId, stepId } = message;
  const effects: EngineEffect[] = [];

  const newRunState = newState.runs[message.runId];
  if (!newRunState) return;

  if (newRunState.steps[stepId].status === "completed") {
    const nextStepId = newRunState.definition.steps[stepId].on?.success;

    if (nextStepId) {
      const effect = {
        kind: "DispatchInternal",
        message: {
          type: "StepReadyToStart",
          stepId: nextStepId,
          runId,
        },
      } satisfies EngineEffect;
      effects.push(effect);
    }
  }

  return effects;
};
