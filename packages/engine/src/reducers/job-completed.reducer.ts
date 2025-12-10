import { RunContext, StepContext } from "@lcase/types/engine";
import type { EngineState, JobCompletedMsg, Reducer } from "../engine.types.js";

export const jobCompletedReducer: Reducer<JobCompletedMsg> = (
  state: EngineState,
  message: JobCompletedMsg
) => {
  const { runId, stepId } = message;
  const runCtx = { ...state.runs[runId] };
  const steps = state.runs[runId].steps;
  const stepCtx = { ...steps[stepId] };

  const newStepCtx = {
    ...stepCtx,
    status: "completed",
    result: message.result,
  } satisfies StepContext;

  const stepsSlice = { ...steps, [stepId]: newStepCtx };

  const runningSteps = new Set([...runCtx.runningSteps]);
  runningSteps.delete(stepId);
  const doneSteps = new Set([...runCtx.doneSteps, stepId]);

  const outstandingSteps = Math.abs(runCtx.outstandingSteps - 1);
  let status = runCtx.status;
  if (
    runningSteps.size === 0 &&
    outstandingSteps === 0 &&
    runCtx.activeJoinSteps.size === 0
  ) {
    status = "completed";
  }
  const newRunContext = {
    ...state.runs[runId],
    steps: stepsSlice,
    outstandingSteps,
    runningSteps,
    doneSteps,
    status,
  } satisfies RunContext;

  const newState = {
    runs: { ...state.runs, [runId]: newRunContext },
  } satisfies EngineState;

  return newState;
};
