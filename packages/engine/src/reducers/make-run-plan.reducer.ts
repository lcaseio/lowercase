import { produce } from "immer";
import { EngineState, Reducer } from "../engine.types.js";
import { MakeRunPlanMsg } from "../types/message.types.js";
import { analyzeFlow, analyzeRefs } from "@lcase/flow-analysis";

export const makeRunPlanReducer: Reducer<MakeRunPlanMsg> = (
  state: EngineState,
  message: MakeRunPlanMsg,
) => {
  return produce(state, (draft) => {
    const runId = message.runId;
    const run = draft.runs[runId];

    if (!run) return;
    const flow = draft.flows[run.flowDefHash];

    if (!flow) return;

    const flowAnalysis = analyzeFlow(flow.definition);
    run.flowAnalysis = flowAnalysis;

    if (flowAnalysis.problems.length !== 0) {
      run.status = "failed";
      return;
    }

    analyzeRefs(flow.definition, flowAnalysis);

    if (flowAnalysis.problems.length !== 0) {
      run.status = "failed";
      return;
    }
  });
};
