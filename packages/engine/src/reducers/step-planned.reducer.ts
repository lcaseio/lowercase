import { produce } from "immer";
import { StepPlannedMsg } from "../message.types.js";
import { EngineState, Reducer } from "../engine.types.js";

export const stepPlannedReducer: Reducer<StepPlannedMsg> = (
  state: EngineState,
  message: StepPlannedMsg
) => {
  return produce(state, (draft) => {
    const runId = message.event.runid;
    const flowId = message.event.flowid;
    const stepId = message.event.data.step.id;

    const run = draft.runs[runId];
    const flow = draft.flows[flowId];

    if (!run) return;
    if (!flow) return;
    const step = flow.definition.steps[stepId];
    const runStepCtx = run.steps[stepId];

    if (!step) return;
    if (!runStepCtx) return;

    if (runStepCtx.status !== "planned") return;
    if (!run.plannedSteps[stepId]) return;

    runStepCtx.status = "started";
    delete run.plannedSteps[stepId];
    run.startedSteps[stepId] = true;
  });
};

// resolve args per step type

// registry for resolving args by step type

/**
 * const httpjsonResolver: Resolver = (step: StepHttpJson) => {
 *
 *
 *
 * };
 */
