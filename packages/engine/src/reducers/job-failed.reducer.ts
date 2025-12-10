import { RunContext, StepContext } from "@lcase/types/engine";
import type { EngineState, JobFailedMsg, Reducer } from "../engine.types.js";

export const jobFailedReducer: Reducer<JobFailedMsg> = (
  state: EngineState,
  message: JobFailedMsg
) => {
  const { runId, stepId } = message;
  const run = { ...state.runs[runId] };
  const steps = state.runs[runId].steps;
  const stepCtx = { ...steps[stepId] };

  const newStepCtx = {
    ...stepCtx,
    status: "failed",
    reason: message.reason,
    result: message.result,
  } satisfies StepContext;

  const stepsSlice = { ...steps, [stepId]: newStepCtx };

  const runningSteps = new Set([...run.runningSteps]);
  runningSteps.delete(stepId);
  const doneSteps = new Set([...run.doneSteps, stepId]);

  const outstandingSteps = Math.abs(run.outstandingSteps - 1);
  let status = run.status;
  if (
    runningSteps.size === 0 &&
    outstandingSteps === 0 &&
    run.activeJoinSteps.size === 0
  ) {
    status = "failed";
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
