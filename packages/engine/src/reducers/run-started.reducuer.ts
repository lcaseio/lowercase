import { produce } from "immer";
import type { EngineState, Reducer, RunStartedMsg } from "../engine.types.js";

export const runStartedReducer: Reducer<RunStartedMsg> = (
  state: EngineState,
  message: RunStartedMsg
): EngineState => {
  return produce(state, (draft) => {
    const runId = message.event.runid;
    const flowId = message.event.flowid;

    const run = draft.runs[runId];
    const flow = draft.flows[flowId];

    if (!run) return;
    if (!flow) return;

    const def = flow.definition;
    const stepId = def.start;
    const step = run.steps[stepId];
    if (!step) return;

    step.status = "planned";
    run.plannedSteps[stepId] = true;
    run.outstandingSteps++;
  });
};
