import { produce } from "immer";
import type { RunContext, StepContext } from "@lcase/types/engine";
import type { EngineState, JobCompletedMsg, Reducer } from "../engine.types.js";

export const jobCompletedReducer: Reducer<JobCompletedMsg> = (
  state: EngineState,
  message: JobCompletedMsg
) => {
  return produce(state, (draft) => {
    const runId = message.event.runid;
    const stepId = message.event.stepid;

    const run = draft.runs[runId];
    const step = run.steps[stepId];

    if (!run) return;
    if (!step) return;

    const fa = run.flowAnalysis;

    step.status = "completed";
    run.completedSteps[stepId] = true;
    delete run.startedSteps[stepId];

    step.output = message.event.data.output;
    run.outstandingSteps = Math.abs(run.outstandingSteps - 1);

    for (const edge of fa.outEdges[stepId]) {
      if (run.steps[edge.endStepId] === undefined) continue;
      if (
        edge.type === "control" &&
        (edge.gate === "always" || edge.gate === "onSuccess") &&
        run.steps[edge.endStepId].status === "initialized"
      ) {
        run.steps[edge.endStepId].status === "planned";
        run.outstandingSteps++;
        run.plannedSteps[edge.endStepId] = true;
      }
      // see if join steps have dependencies all finished
      else if (edge.type === "join") {
        // if they all succeeded, succeed/complete join
        // if all either completed or failed, but not succeeded, fail join
        let allCompleted = true;
        let allFinished = true;
        for (const stepId of fa.joinDeps[edge.endStepId]) {
          const step = run.steps[stepId];
          if (!step) {
            allCompleted = false;
            allFinished = false;
            break;
          }
          if (step.status !== "completed") allCompleted = false;
          if (step.status !== "completed" && step.status !== "failed") {
            allFinished = false;
          }
        }
        if (allCompleted) {
          run.steps[edge.endStepId].status === "completed";
          run.outstandingSteps++;
          run.completedSteps[edge.endStepId] = true;
        } else if (allFinished === true) {
          run.steps[edge.endStepId].status === "failed";
          run.outstandingSteps++;
          run.failedSteps[edge.endStepId] = true;
        }
      }
    }
  });
};
