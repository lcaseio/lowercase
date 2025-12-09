import { RunContext } from "@lcase/types/engine";
import type {
  EngineState,
  Reducer,
  StartHttpJsonStepMsg,
} from "../engine.types.js";
import { resolveFlatFields } from "../resolve.js";

export const startHttpJsonStepReducer: Reducer<StartHttpJsonStepMsg> = (
  state: EngineState,
  message: StartHttpJsonStepMsg
) => {
  const { runId, stepId } = message;
  const runCtx = { ...state.runs[runId] };
  const stepDef = { ...runCtx.definition.steps[stepId] };
  const stepCtx = { ...runCtx.steps[stepId] };
  if (runCtx.steps[stepId].status !== "pending") return;
  if (stepDef.type !== "httpjson") return;

  const allStepsCtx = { ...runCtx.steps };

  runCtx.outstandingSteps++;
  runCtx.runningSteps = new Set([...runCtx.runningSteps, stepId]);
  runCtx.steps[stepId].status = "started";

  const fields = resolveFlatFields(
    {
      url: stepDef.url,
    },
    allStepsCtx
  );

  stepCtx.resolved = {
    ...(fields.url ? { url: fields.url } : {}),
  };

  fields.url ?? stepDef.url;

  const newRunContext = {
    ...runCtx,
    steps: {
      ...runCtx.steps,
      [stepId]: {
        ...stepCtx,
        status: "started",
        attempt: runCtx.steps[stepId].attempt + 1,
      },
    },
  } satisfies RunContext;

  return { runs: { [runId]: newRunContext } };
};
