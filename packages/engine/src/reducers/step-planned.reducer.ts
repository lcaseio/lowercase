import { produce } from "immer";
import { StepPlannedMsg } from "../types/message.types.js";
import { EngineState, Reducer } from "../engine.types.js";
import { resolvePath } from "../references/resolve-path.js";

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

    const refs = run.flowAnalysis.refs.filter((ref) => ref.stepId === stepId);
    if (!refs.length) return;

    for (const ref of refs) {
      const value = resolvePath(ref.path, {
        steps: run.steps,
        input: run.input,
      });
      run.steps[stepId].resolved = { [ref.string]: value };
    }
  });
};
