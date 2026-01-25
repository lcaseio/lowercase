import { EngineEffect, EngineState, Planner } from "../engine.types.js";
import { GetForkSpecFx } from "../types/effect.types.js";
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
  if (newRunState.status === "failed") {
    // emit denied
    console.log("flow def failed");
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

  // else go ahead and request a flow analysis or just fa + run plan
  return effects;
};

// flow  -> emit flow.definition.failed
// flow analysis -> flow.analysis.failed
// fork spec -> denied flow.forkspec.failed
// run index -> denied run.parent.index.failed
//
// run.planned / run.denied
