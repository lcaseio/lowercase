import {
  Planner,
  EngineEffect,
  EngineState,
  JobCompletedMsg,
  DispatchInternalFx,
  FlowCompletedMsg,
  EmitStepCompletedFx,
  UpdateJoinMsg,
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

  const step = newRunState.definition.steps[stepId];
  const stepCtx = newRunState.steps[stepId];

  if (step.type === "parallel") return;
  if (step.type === "join") return;
  if (stepCtx.status === "completed") {
    const nextStepId = step.on?.success;

    const emitStepCompletedFx = {
      kind: "EmitStepCompleted",
      eventType: "step.completed",
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
      } satisfies EngineEffect;
      effects.push(effect);
    } else if (newRunState.status === "completed") {
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
