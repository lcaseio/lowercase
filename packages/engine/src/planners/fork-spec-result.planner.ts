import { EngineEffect, EngineState, Planner } from "../engine.types.js";
import { EmitRunDeniedFx, GetRunIndexFx } from "../types/effect.types.js";
import { ForkSpecResultMsg } from "../types/message.types.js";

export const forkSpecResultPlanner: Planner<ForkSpecResultMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: ForkSpecResultMsg,
) => {
  const effects: EngineEffect[] = [];
  const runId = message.runId;
  const newRunState = newState.runs[runId];

  if (!newRunState) return effects;

  if (newRunState.status === "failed" && message.ok === false) {
    // emit run.denied with error message
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
  // if some analysis in the reducer says we don't need an index,
  // then go ahead an create a flow analysis

  if (newRunState.forkSpec?.parentRunId) {
    const fx: GetRunIndexFx = {
      type: "GetRunIndex",
      parentRunId: newRunState.forkSpec.parentRunId,
      runId,
    };
    effects.push(fx);
  }

  return effects;
};
