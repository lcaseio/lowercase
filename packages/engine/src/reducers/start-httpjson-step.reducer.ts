import { RunContext } from "@lcase/types/engine";
import type { EngineState, Reducer, StartHttjsonStepMsg } from "../engine.js";
import { randomUUID } from "crypto";

export const startHttpjsonStepReducer: Reducer<StartHttjsonStepMsg> = (
  state: EngineState,
  message: StartHttjsonStepMsg
) => {
  const { runId, stepId } = message;
  const run = { ...state.runs[runId] };
  if (run.steps[stepId].status !== "pending") return;

  run.outstandingSteps++;
  run.runningSteps = new Set([...run.runningSteps, stepId]);
  run.steps[stepId].status = "started";

  const newRunContext = {
    ...run,
    steps: {
      ...run.steps,
      [stepId]: {
        ...run.steps[stepId],
        status: "started",
        attempt: run.steps[stepId].attempt + 1,
      },
    },
  } satisfies RunContext;

  return { runs: { [runId]: newRunContext } };
};

/**
 * flowStar
 *  make run context         (flowStartedMsg)
 *  make all step contexts
 *  starts first step
 * run started
 *  does nothing, just a message
 *  could make context here, or not
 *
 * step started
 *  resolves fields (generic?) -
 *  updates state for status, attempts etc
 *  emits the job thing
 *
 *
 *
 */
