import { RunContext, StepContext } from "@lcase/types/engine";
import type { EngineState, JobFailedMsg, Reducer } from "../engine.types.js";

export const jobFailedReducer: Reducer<JobFailedMsg> = (
  state: EngineState,
  message: JobFailedMsg
) => {
  const { runId, stepId } = message;
  const run = state.runs[runId];
  const steps = state.runs[runId].steps;
  const stepCtx = steps[stepId];

  const newStepCtx = {
    ...stepCtx,
    status: "failed",
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
    status: "failed",
  } satisfies RunContext;

  const newState = {
    runs: { ...state.runs, [runId]: newRunContext },
  } satisfies EngineState;

  return newState;
};
