import { produce } from "immer";
import { EngineState, Reducer } from "../engine.types.js";
import { RunRequestedMsg } from "../types/message.types.js";
import { RunContext } from "@lcase/types";

export const runRequestedReducer: Reducer<RunRequestedMsg> = (
  state: EngineState,
  message: RunRequestedMsg,
) => {
  return produce(state, (draft) => {
    const runId = message.event.runid;
    const flowId = message.event.flowid;
    const traceId = message.event.traceid;
    const flowDefHash = message.event.data.flowDefHash;
    const forkSpecHash = message.event.data.forkSpecHash;

    console.log("runRequestedReducer");
    if (draft.runs[runId] !== undefined) return; // run id already exists

    const runCtx = {
      flowId,
      flowDefHash,
      ...(forkSpecHash ? { forkSpecHash } : {}),
      runId,
      traceId,
      runPlan: {
        reuse: {},
      },
      startedSteps: {},
      plannedSteps: {},
      completedSteps: {},
      failedSteps: {},
      outstandingSteps: 0,
      input: {},
      status: "requested",
      steps: {},
      flowAnalysis: {
        nodes: [],
        inEdges: {},
        outEdges: {},
        joinDeps: {},
        problems: [],
        refs: [],
      },
    } satisfies RunContext;

    console.log("made run context");
    draft.runs[runId] = runCtx;
  });
};
