import type { RunContext } from "@lcase/types/engine";
import type { WritableDraft } from "immer";

export function setRunStatus(run: WritableDraft<RunContext>) {
  if (run.outstandingSteps === 0 && Object.keys(run.failedSteps).length > 0) {
    run.status = "failed";
  } else if (run.outstandingSteps === 0) {
    run.status = "completed";
  }
  console.log("outstandingSteps", run.outstandingSteps);
  console.log("run.status", run.status);
  console.log("run.completedSteps", run.completedSteps.length);
  console.log("run.failedSteps", run.failedSteps.length);
  console.log("run.plannedSteps", JSON);
  console.log(JSON.stringify(run, null, 2));
}
