import { RunContext } from "@lcase/types/engine";
import type { EngineState, Reducer, StartMcpStepMsg } from "../engine.types.js";

export const startMcpStepReducer: Reducer<StartMcpStepMsg> = (
  state: EngineState,
  message: StartMcpStepMsg
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
