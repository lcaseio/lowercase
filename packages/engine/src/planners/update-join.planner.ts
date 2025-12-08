import {
  DispatchInternalFx,
  EmitStepCompletedFx,
  EmitStepFailedFx,
  EngineEffect,
  Planner,
  PlannerArgs,
  StepReadyToStartMsg,
  UpdateJoinMsg,
} from "../engine.types.js";

export const updateJoinPlanner: Planner<UpdateJoinMsg> = (
  args: PlannerArgs<UpdateJoinMsg>
) => {
  const { newState, message } = args;
  const { runId, stepId, joinStepId } = message;
  const runCtx = newState.runs[runId];

  const joinStepCtx = runCtx.steps[joinStepId];
  const joinStepDef = newState.runs[runId].definition.steps[joinStepId];

  const effects: EngineEffect[] = [];

  if (joinStepDef.type !== "join") return;
  if (joinStepCtx.status === "pending") return;

  if (
    joinStepCtx.status === "completed" &&
    !newState.runs[runId].activeJoinSteps.has(joinStepId)
  ) {
    const joinCompletedEffect = {
      kind: "EmitStepCompleted",
      eventType: "step.completed",
      scope: {
        flowid: runCtx.flowId,
        runid: runId,
        source: "lowercase://engine",
        stepid: joinStepId,
        steptype: joinStepDef.type,
      },
      data: {
        status: "success",
        step: {
          id: joinStepId,
          name: joinStepId,
          type: joinStepDef.type,
          joinFrom: joinStepDef.steps,
        },
      },
      traceId: runCtx.traceId,
    } satisfies EmitStepCompletedFx;

    effects.push(joinCompletedEffect);
    const effect = {
      kind: "DispatchInternal",
      message: {
        type: "StepReadyToStart",
        runId,
        stepId: joinStepDef.next,
      } satisfies StepReadyToStartMsg,
    } satisfies DispatchInternalFx;
    effects.push(effect);
  }

  if (
    joinStepCtx.status === "failed" &&
    !newState.runs[runId].activeJoinSteps.has(joinStepId)
  ) {
    const effect = {
      kind: "EmitStepFailed",
      eventType: "step.failed",
      scope: {
        flowid: runCtx.flowId,
        runid: runId,
        source: "lowercase://engine",
        stepid: joinStepId,
        steptype: joinStepDef.type,
      },
      data: {
        reason: "join failed",
        status: "failure",
        step: {
          id: stepId,
          name: stepId,
          type: joinStepDef.type,
          joinFrom: [...joinStepDef.steps],
        },
      },
      traceId: runCtx.traceId,
    } satisfies EmitStepFailedFx;
    effects.push(effect);
  }
  return effects;
};
