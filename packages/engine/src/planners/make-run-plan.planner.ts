import type {
  EmitRunStartedFx,
  EngineEffect,
  EngineState,
  Planner,
} from "../engine.types.js";
import type { MakeRunPlanMsg } from "../types/message.types.js";

export const makeRunPlanPlanner: Planner<MakeRunPlanMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: MakeRunPlanMsg,
) => {
  const effects: EngineEffect[] = [];
  const runId = message.runId;
  const newRunState = newState.runs[runId];

  if (!newRunState) return effects;

  if (newRunState.status !== "started") {
    // emit run.denied / failed
    console.log("run denied");
    return effects;
  }

  const fx: EmitRunStartedFx = {
    type: "EmitRunStarted",
    scope: {
      flowid: newRunState.flowId,
      runid: runId,
      source: "lowercase://engine",
    },
    data: null,
    traceId: newRunState.traceId,
  };

  effects.push(fx);

  return effects;
};
