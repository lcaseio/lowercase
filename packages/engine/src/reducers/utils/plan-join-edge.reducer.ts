import { Edge } from "@lcase/types";
import { RunContext } from "@lcase/types/engine";
import { WritableDraft } from "immer";

export function planJoinEdge(
  edge: WritableDraft<Edge>,
  run: WritableDraft<RunContext>
) {
  if (edge.type !== "join") return;
  // if they all succeeded, succeed/complete join
  // if all either completed or failed, but not succeeded, fail join
  let allCompleted = true;
  let allFinished = true;
  const fa = run.flowAnalysis;
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
