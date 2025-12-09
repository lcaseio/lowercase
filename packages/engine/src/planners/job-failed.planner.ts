import type {
  Planner,
  EngineEffect,
  EngineState,
  JobFailedMsg,
  DispatchInternalFx,
  EmitStepFailedFx,
  UpdateJoinMsg,
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

  const step = newRunState.definition.steps[stepId];
  const stepCtx = newRunState.steps[stepId];

  if (step.type === "parallel") return;
  if (step.type === "join") return;
  if (stepCtx.status !== "failed") return;

  const nextStepId = step.on?.failure;

  const emitStepCompletedFx = {
    kind: "EmitStepFailed",
    eventType: "step.failed",
    scope: {
      flowid: newState.runs[runId].flowId,
      runid: runId,
      source: "lowercase://engine",
      stepid: stepId,
      steptype: step.type,
    },
    data: {
      status: "failure",
      step: {
        id: stepId,
        name: stepId,
        type: step.type,
      },
      reason: message.reason,
    },
    traceId: newRunState.traceId,
  } satisfies EmitStepFailedFx;

  effects.push(emitStepCompletedFx);

  // send update messages to joins that are waiting on this step
  if (stepCtx.joins.size > 0) {
    for (const joinStepId of stepCtx.joins.values()) {
      const updateJoinEffect = {
        kind: "DispatchInternal",
        message: {
          type: "UpdateJoin",
          runId,
          stepId,
          joinStepId,
        } satisfies UpdateJoinMsg,
      } satisfies DispatchInternalFx;
      effects.push(updateJoinEffect);
    }
  }

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
  } else if (newRunState.status === "failed") {
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
