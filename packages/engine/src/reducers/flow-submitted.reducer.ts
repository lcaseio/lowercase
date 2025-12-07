import { RunContext, StepContext } from "@lcase/types/engine";
import {
  EngineState,
  FlowSubmittedMsg,
  Patch,
  Reducer,
} from "../engine.types.js";
import { StepDefinition } from "@lcase/types";

export const flowSubmittedReducer: Reducer<FlowSubmittedMsg> = (
  state: EngineState,
  message: FlowSubmittedMsg
): Patch | void => {
  // make step context for all steps
  const { definition } = message;

  const initAllStepContexts: Record<string, StepContext> = {};

  const joinMap = makeJoinSetsForSteps(definition.steps);

  for (const step of Object.keys(definition.steps)) {
    const stepContext: StepContext = {
      status: "pending",
      attempt: 0,
      exports: {},
      result: {},
      stepId: step,
      joins: joinMap[step] ?? new Set<string>(),
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
    activeJoinSteps: new Set<string>(),
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

/**
 * Create a new map of step ids to join steps, which is inverting the
 * dependencies.  These normally live inside join steps, but we apply them
 * to each step, if they are mentioned in a join, in order for easy lookup when
 * a step ends.
 * @param steps Record<string, StepDefinition>
 */
export function makeJoinSetsForSteps(
  steps: Record<string, StepDefinition>
): Record<string, Set<string>> {
  const joinMap: Record<string, Set<string>> = {};
  for (const [stepId, definition] of Object.entries(steps)) {
    if (definition.type !== "join") continue;

    for (const joinTarget of definition.steps) {
      joinMap[joinTarget] ??= new Set();
      joinMap[joinTarget].add(stepId);
    }
  }
  return joinMap;
}
