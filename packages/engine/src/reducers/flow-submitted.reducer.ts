import { RunContext, StepContext } from "@lcase/types/engine";
import {
  EngineState,
  FlowSubmittedMsg,
  Patch,
  Reducer,
} from "../engine.types.js";

export const flowSubmittedReducer: Reducer<FlowSubmittedMsg> = (
  state: EngineState,
  message: FlowSubmittedMsg
): Patch | void => {
  // make step context for all steps
  const { definition } = message;

  const initAllStepContexts: Record<string, StepContext> = {};
  for (const step of Object.keys(definition.steps)) {
    const stepContext: StepContext = {
      status: "pending",
      attempt: 0,
      exports: {},
      result: {},
      stepId: step,
    };

    initAllStepContexts[step] = stepContext;
  }

  const runCtx = {
    flowId: message.flowId,
    flowName: definition.name,
    definition: definition,
    runId: message.runId,
    traceId: message.meta.traceId,
    runningSteps: new Set<string>(),
    queuedSteps: new Set<string>(),
    doneSteps: new Set<string>(),
    outstandingSteps: 0,
    inputs: definition.inputs ?? {},
    exports: {},
    globals: {},
    status: "pending",
    steps: initAllStepContexts,
  } satisfies RunContext;

  return {
    runs: {
      ...state.runs,
      [message.runId]: runCtx,
    },
  };
};
