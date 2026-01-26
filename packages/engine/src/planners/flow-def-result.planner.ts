import { EngineEffect, EngineState, Planner } from "../engine.types.js";
import { EmitRunDeniedFx, GetForkSpecFx } from "../types/effect.types.js";
import { FlowDefResultMsg } from "../types/message.types.js";

export const flowDefResultPlanner: Planner<FlowDefResultMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: FlowDefResultMsg,
) => {
  const effects: EngineEffect[] = [];
  const runId = message.runId;

  const newRunState = newState.runs[runId];

  if (!newRunState) return effects;
  if (newRunState.status === "failed" && message.ok === false) {
    // emit denied
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
    return effects;
  }

  if (newRunState.forkSpecHash !== undefined) {
    //emit getFlowSpec
    const fx: GetForkSpecFx = {
      type: "GetForkSpec",
      hash: newRunState.forkSpecHash,
      runId,
    };
    effects.push(fx);
    return effects;
  }

  return effects;
};
