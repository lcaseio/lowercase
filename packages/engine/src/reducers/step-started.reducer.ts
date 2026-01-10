import { produce } from "immer";
import { StepStartedMsg } from "../types/message.types.js";
import { EngineState, Reducer } from "../engine.types.js";

export const stepStartedReducer: Reducer<StepStartedMsg> = (
  state: EngineState,
  message: StepStartedMsg
) => {
  return produce(state, (draft) => {
    const runId = message.event.runid;
    const stepId = message.event.stepid;
    const stepType = message.event.steptype;

    const run = draft.runs[runId];
    const fa = run.flowAnalysis;

    if (!run) return;

    if (stepType === "parallel") {
      for (const edge of fa.outEdges[stepId]) {
        if (run.steps[edge.endStepId].status === "initialized") {
          run.steps[edge.endStepId].status = "planned";
          run.plannedSteps[edge.endStepId] = true;
          run.outstandingSteps++;
        }
      }
    }
  });
};
