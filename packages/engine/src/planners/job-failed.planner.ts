import type {
  Planner,
  EngineEffect,
  EngineState,
  JobFailedMsg,
  DispatchInternalFx,
  EmitStepFailedFx,
} from "../engine.types.js";

export const jobFailedPlanner: Planner<JobFailedMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: JobFailedMsg;
}): EngineEffect[] | void => {
  const { newState, message } = args;
  const { runId, stepId } = message;
  const effects: EngineEffect[] = [];

  const newRunState = newState.runs[message.runId];
  if (!newRunState) return;

  if (newRunState.steps[stepId].status !== "failed") return;

  const nextStepId = newRunState.definition.steps[stepId].on?.failure;

  const emitStepCompletedFx = {
    kind: "EmitStepFailed",
    eventType: "step.failed",
    scope: {
      flowid: newState.runs[runId].flowId,
      runid: runId,
      source: "lowercase://engine",
      stepid: stepId,
      steptype: newRunState.definition.steps[stepId].type,
    },
    data: {
      status: "failure",
      step: {
        id: stepId,
        name: stepId,
        type: newRunState.definition.steps[stepId].type,
      },
      reason: message.reason,
    },
    traceId: newRunState.traceId,
  } satisfies EmitStepFailedFx;

  effects.push(emitStepCompletedFx);

  if (nextStepId) {
    const effect = {
      kind: "DispatchInternal",
      message: {
        type: "StepReadyToStart",
        stepId: nextStepId,
        runId,
      },
    } satisfies DispatchInternalFx;
    effects.push(effect);
  } else if (
    newRunState.outstandingSteps === 0 &&
    newRunState.runningSteps.size === 0
  ) {
    const effect = {
      kind: "DispatchInternal",
      message: {
        type: "FlowFailed",
        runId: message.runId,
        stepId: message.stepId,
      },
    } satisfies DispatchInternalFx;
    effects.push(effect);
  }

  return effects;
};
