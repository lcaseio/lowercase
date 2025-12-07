import { EngineState, Reducer, UpdateJoinMsg } from "../engine.types.js";

export const updateJoinReducer: Reducer<UpdateJoinMsg> = (
  state: EngineState,
  message: UpdateJoinMsg
) => {
  const { runId, stepId, joinStepId } = message;
  const runCtx = state.runs[runId];
  const joinStepCtx = { ...runCtx.steps[joinStepId] };

  const joinStepDef = runCtx.definition.steps[joinStepId];

  if (joinStepDef.type !== "join") return;

  // check and see what the status of the stepId is
  const status = runCtx.steps[stepId].status;

  // add this status to join step "results"
  joinStepCtx.result[stepId] ??= status;

  // if join status is pending and stepId status is failed
  if (joinStepCtx.status === "pending" && status === "failed") {
    runCtx.activeJoinSteps.delete(joinStepId);
    joinStepCtx.status = "failed";
  }
  // otherwise loop through and see if the join step is "done"
  else if (joinStepCtx.status === "pending" && status === "completed") {
    if (joinStepDef.steps.length === Object.keys(joinStepCtx.result).length) {
      joinStepCtx.status = "completed";
      runCtx.activeJoinSteps.delete(joinStepId);
    }
  }
  runCtx.steps = {
    ...runCtx.steps,
    [joinStepId]: { ...joinStepCtx },
  };

  return { runs: { [runId]: runCtx } };
};
