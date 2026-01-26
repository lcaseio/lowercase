import type { EngineEffect, EngineState, Planner } from "../engine.types.js";
import { EmitRunDeniedFx, MakeRunPlanFx } from "../types/effect.types.js";
import type { RunIndexResultMsg } from "../types/message.types.js";

export const runIndexResultPlanner: Planner<RunIndexResultMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: RunIndexResultMsg,
) => {
  const effects: EngineEffect[] = [];
  const runId = message.runId;
  const newRunState = newState.runs[runId];

  if (!newRunState) return effects;

  if (newRunState.status === "failed" && message.ok === false) {
    const fx: EmitRunDeniedFx = {
      type: "EmitRunDenied",
      data: {
        error: message.error,
      },
      scope: {
        flowid: newRunState.flowDefHash,
        runid: runId,
        source: "lowercase://engine",
      },
      traceId: newRunState.traceId,
    };
    effects.push(fx);
    return effects;
  }

  const fx: MakeRunPlanFx = {
    type: "MakeRunPlan",
    runId,
  };
  effects.push(fx);
  return effects;
};
