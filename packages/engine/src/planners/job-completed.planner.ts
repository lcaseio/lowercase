import {
  Planner,
  EngineEffect,
  EngineState,
  JobCompletedMsg,
  DispatchInternalFx,
  FlowCompletedMsg,
  EmitStepCompletedFx,
} from "../engine.types.js";

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

  if (newRunState.definition.steps[stepId].type === "parallel") return;
  if (newRunState.definition.steps[stepId].type === "join") return;
  if (newRunState.steps[stepId].status === "completed") {
    const nextStepId = newRunState.definition.steps[stepId].on?.success;

    const emitStepCompletedFx = {
      kind: "EmitStepCompleted",
      eventType: "step.compelted",
      scope: {
        flowid: newState.runs[runId].flowId,
        runid: runId,
        source: "lowercase://engine",
        stepid: stepId,
        steptype: newRunState.definition.steps[stepId].type,
      },
      data: {
        status: "success",
        step: {
          id: stepId,
          name: stepId,
          type: newRunState.definition.steps[stepId].type,
        },
      },
      traceId: newRunState.traceId,
    } satisfies EmitStepCompletedFx;
    effects.push(emitStepCompletedFx);

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
    } else if (
      newRunState.outstandingSteps === 0 &&
      newRunState.runningSteps.size === 0
    ) {
      const effect = {
        kind: "DispatchInternal",
        message: {
          type: "FlowCompleted",
          runId,
          stepId,
        } satisfies FlowCompletedMsg,
      } satisfies DispatchInternalFx;
      effects.push(effect);
    }
  }

  return effects;
};
