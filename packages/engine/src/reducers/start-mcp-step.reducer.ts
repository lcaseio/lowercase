import { RunContext } from "@lcase/types/engine";
import type { EngineState, Reducer, StartMcpStepMsg } from "../engine.types.js";
import { resolveStepArgs } from "../resolve.js";

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

  // take the args
  // go through each
  // resolve them
  // add them only if they resolved
  if (run.definition.steps[stepId].type !== "mcp") return;

  const args = resolveStepArgs(
    { ...run.steps },
    {
      ...run.definition.steps[stepId].args,
    }
  );

  const newRunContext = {
    ...run,
    steps: {
      ...run.steps,
      [stepId]: {
        ...run.steps[stepId],
        status: "started",
        attempt: run.steps[stepId].attempt + 1,
        args,
      },
    },
  } satisfies RunContext;

  return { runs: { [runId]: newRunContext } };
};
