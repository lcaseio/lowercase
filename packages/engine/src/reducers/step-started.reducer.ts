import { produce } from "immer";
import type { EngineState, Reducer } from "../engine.types.js";
import type { StepStartedMsg } from "../types/message.types.js";
import { resolvePath } from "../references/resolve-path.js";

export const stepStartedReducer: Reducer<StepStartedMsg> = (
  state: EngineState,
  message: StepStartedMsg
) => {
  return produce(state, (draft) => {
    const runId = message.event.runid;
    const stepId = message.event.stepid;
    const flowId = message.event.flowid;

    const run = draft.runs[runId];
    if (!run) return;
    if (!run.flowAnalysis.nodes.includes(stepId)) return;

    const refs = run.flowAnalysis.refs.filter((ref) => ref.stepId === stepId);

    // if the step contains references, resolve them, then replace them
    if (refs.length) {
      for (const ref of refs) {
        const value = resolvePath(ref.path, {
          steps: run.steps,
          input: run.inputs,
        });
        run.steps[stepId].resolved = { [ref.string]: value };
      }
    }
  });
};
