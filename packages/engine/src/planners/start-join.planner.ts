import {
  EmitJoinStepStartedFx,
  EngineEffect,
  Planner,
  PlannerArgs,
  StartJoinMsg,
} from "../engine.types.js";

export const startJoinPlanner: Planner<StartJoinMsg> = (
  args: PlannerArgs<StartJoinMsg>
) => {
  const { oldState, newState, message } = args;
  const { runId, joinStepId } = message;

  const oldJoinStatus = oldState.runs[runId].steps[joinStepId].status;

  const effects: EngineEffect[] = [];
  const runCtx = newState.runs[runId];
  console.log("emitting step.started for join 1");

  if (runCtx.definition.steps[joinStepId].type !== "join") return;
  if (oldJoinStatus === "started") return;
  console.log("emitting step.started for join 2");

  const effect = {
    kind: "EmitJoinStepStarted",
    scope: {
      flowid: newState.runs[runId].flowId,
      runid: runId,
      source: "lowercase://engine",
      stepid: joinStepId,
      steptype: runCtx.definition.steps[joinStepId].type,
    },
    data: {
      status: "started",
      step: {
        id: joinStepId,
        name: joinStepId,
        type: runCtx.definition.steps[joinStepId].type,
        joinFrom: [...runCtx.definition.steps[joinStepId].steps],
      },
    },
    traceId: newState.runs[runId].traceId,
  } satisfies EmitJoinStepStartedFx;
  effects.push(effect);
  return effects;
};
