import { EngineState, Reducer, StartJoinMsg } from "../engine.types.js";

export const startJoinReducer: Reducer<StartJoinMsg> = (
  state: EngineState,
  message: StartJoinMsg
) => {
  const { runId, joinStepId } = message;

  const runCtx = state.runs[runId];
  const stepCtx = { ...runCtx.steps[joinStepId] };

  if (stepCtx.status !== "pending") return;

  stepCtx.status = "started";
  runCtx.activeJoinSteps.add(joinStepId);

  console.log("startJoin");
  return {
    runs: {
      [runId]: {
        ...runCtx,
        steps: {
          ...runCtx.steps,
          [joinStepId]: stepCtx,
        },
      },
    },
  };
};
