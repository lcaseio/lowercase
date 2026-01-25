import { produce } from "immer";
import { EngineState, Reducer } from "../engine.types.js";
import { MakeRunPlanMsg } from "../types/message.types.js";
import { analyzeFlow, analyzeRefs } from "@lcase/flow-analysis";
import { StepContext } from "@lcase/types";

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

    console.log("making flow analysis");

    const flowAnalysis = analyzeFlow(flow.definition);
    run.flowAnalysis = flowAnalysis;

    if (flowAnalysis.problems.length !== 0) {
      console.log("flow analysis has problems");
      run.status = "failed";
      return;
    }

    analyzeRefs(flow.definition, flowAnalysis);

    if (flowAnalysis.problems.length !== 0) {
      console.log("references had problems");
      run.status = "failed";
      return;
    }

    // try to build run plan inline for now.
    // assumes steps not reused are rerun

    if (run.forkSpec && run.runIndex) {
      for (const stepId of run.forkSpec.reuse) {
        run.runPlan.reuse[stepId] = {
          status: run.runIndex.steps[stepId].status!,
          outputHash: run.runIndex.steps[stepId].outputHash,
        };
      }
    }

    // quickly initialize each step by flow definition
    const initAllStepContexts: Record<string, StepContext> = {};

    for (const step of Object.keys(flow.definition.steps)) {
      const stepContext: StepContext = {
        status: "initialized",
        attempt: 0,
        output: {},
        outputHash: null,
        resolved: {},
      };

      initAllStepContexts[step] = stepContext;
    }
    run.steps = initAllStepContexts;

    console.log("run plan", JSON.stringify(run.runPlan, null, 2));
    run.status = "started";
  });
};
