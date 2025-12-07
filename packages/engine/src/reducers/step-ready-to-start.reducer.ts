import {
  EngineState,
  Patch,
  Reducer,
  StepReadyToStartMsg,
} from "../engine.types.js";

export const stepReadyToStartReducer: Reducer<StepReadyToStartMsg> = (
  state: EngineState,
  message: StepReadyToStartMsg
): Patch | void => {
  const run = { ...state.runs[message.runId] };

  const { runId, stepId } = message;

  // if set ctx has any joins, add those to active join steps
  // and maybe update that to the steps results maybe
  const stepCtx = run.steps[stepId];

  if (stepCtx.joins.size > 0) {
    for (const joinStep of stepCtx.joins.values()) {
      if (run.steps[joinStep].status === "pending") {
        run.activeJoinSteps.add(joinStep);
      }
    }
  }

  return { runs: { [message.runId]: { ...run, status: "started" } } };
};
