import { RunContext, StepContext } from "@lcase/types/engine";
import type { EngineState, JobCompletedMsg, Reducer } from "../engine.js";

export const jobCompletedReducer: Reducer<JobCompletedMsg> = (
  state: EngineState,
  message: JobCompletedMsg
) => {
  const { runId, stepId } = message;
  const run = state.runs[runId];
  const steps = state.runs[runId].steps;
  const stepCtx = steps[stepId];

  const newStepCtx = {
    ...stepCtx,
    status: "completed",
  } satisfies StepContext;

  const stepsSlice = { ...steps, [stepId]: newStepCtx };

  const runningSteps = new Set([...run.runningSteps]);
  runningSteps.delete(stepId);
  const doneSteps = new Set([...run.doneSteps, stepId]);
  const newRunContext = {
    ...state.runs[runId],
    steps: stepsSlice,
    outstandingSteps: Math.abs(run.outstandingSteps - 1),
    runningSteps,
    doneSteps,
    status: "completed",
  } satisfies RunContext;

  const newState = {
    runs: { ...state.runs, [runId]: newRunContext },
  } satisfies EngineState;

  console.log("newState", newState);
  return newState;
};
