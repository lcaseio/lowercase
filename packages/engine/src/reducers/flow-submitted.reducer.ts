import { produce } from "immer";
import { RunContext, StepContext } from "@lcase/types/engine";
import { EngineState, FlowSubmittedMsg, Reducer } from "../engine.types.js";
import { StepDefinition } from "@lcase/types";
import { analyzeFlow, analyzeRefs } from "@lcase/flow-analysis";

/**
 * Invoked after a `flow.submitted` event received.
 * Initializes state for the run, steps, and flow.
 * Sets runs status to `started`.
 * @param state EngineState
 * @param message FlowSubmittedMsg
 * @returns EngineState
 */
export const flowSubmittedReducer: Reducer<FlowSubmittedMsg> = (
  state: EngineState,
  message: FlowSubmittedMsg
): EngineState => {
  return produce(state, (draft) => {
    // make step context for all steps
    const flowId = message.event.flowid;
    const runId = message.event.runid;
    const traceId = message.event.traceid;
    const definition = message.event.data.definition;
    const flowCtx = draft.flows[flowId] ?? {};

    const initAllStepContexts: Record<string, StepContext> = {};

    for (const step of Object.keys(definition.steps)) {
      const stepContext: StepContext = {
        status: "initialized",
        attempt: 0,
        output: {},
        resolved: {},
      };

      initAllStepContexts[step] = stepContext;
    }

    const flowAnalysis = analyzeFlow(definition);
    analyzeRefs(definition, flowAnalysis);

    const status = flowAnalysis.problems.length ? "failed" : "started";
    const runCtx = {
      flowId,
      flowName: definition.name,
      flowVersion: definition.version,
      runId,
      traceId,
      startedSteps: {},
      plannedSteps: {},
      completedSteps: {},
      failedSteps: {},
      outstandingSteps: 0,
      input: definition.inputs ?? {},
      status,
      steps: initAllStepContexts,
      flowAnalysis,
    } satisfies RunContext;

    // store flow seperately for easier snapshots possibly
    flowCtx.definition ??= definition;
    flowCtx.runIds ??= {};
    flowCtx.runIds[runId] = true;
    draft.runs[runId] = runCtx;
    draft.flows[flowId] = flowCtx;
  });
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
): Record<string, Record<string, boolean>> {
  const joinMap: Record<string, Record<string, boolean>> = {};
  for (const definition of Object.values(steps)) {
    if (definition.type !== "join") continue;

    for (const joinTarget of definition.steps) {
      joinMap[joinTarget] ??= {};
      joinMap[joinTarget] = { stepId: true };
    }
  }
  return joinMap;
}
