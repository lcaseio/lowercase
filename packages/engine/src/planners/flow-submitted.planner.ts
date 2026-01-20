import {
  Planner,
  EngineEffect,
  EngineState,
  FlowSubmittedMsg,
  EmitRunStartedFx,
  EmitFlowAnalyzedFx,
  EmitFlowFailedFx,
  WriteContextToDiskFx,
} from "../engine.types.js";

/**
 * Plans to run EmitRunStartedFx if run status is started, and
 * previous state the run context was undefined.
 * @param oldState EngineState pre reducer
 * @param newState EngineState post reducer
 * @param message FlowSubmittedMsg
 * @returns EngineEffect[]
 */
export const flowSubmittedPlanner: Planner<FlowSubmittedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: FlowSubmittedMsg,
): EngineEffect[] => {
  const runId = message.event.runid;
  const newRunState = newState.runs[runId];
  const oldRunState = oldState.runs[runId];

  const effects: EngineEffect[] = [];

  if (!newRunState) return effects;
  if (newRunState.status !== "started" && newRunState.status !== "failed")
    return effects;
  if (oldRunState !== undefined) return effects;

  const emitFlowAnalyzedFx: EmitFlowAnalyzedFx = {
    type: "EmitFlowAnalyzed",
    scope: {
      flowid: newRunState.flowId,
      runid: newRunState.runId,
      source: "lowercase://engine",
    },
    data: {
      flow: {
        id: newRunState.flowId,
        name: newRunState.flowName,
        version: newRunState.flowVersion,
      },
      run: {
        id: newRunState.runId,
      },
      analysis: newRunState.flowAnalysis,
    },
    traceId: newRunState.traceId,
  };

  effects.push(emitFlowAnalyzedFx);

  if (newRunState.status === "started") {
    effects.push({
      type: "EmitRunStarted",
      data: null,
      scope: {
        flowid: newRunState.flowId,
        runid: newRunState.runId,
        source: "lowercase://engine",
      },
      traceId: newRunState.traceId,
    } satisfies EmitRunStartedFx);
  } else if (newRunState.status === "failed") {
    effects.push({
      type: "EmitFlowFailed",
      data: {
        flow: {
          id: newRunState.flowId,
          name: newRunState.flowName,
          version: newRunState.flowVersion,
        },
        run: {
          id: newRunState.runId,
        },
        status: "failure",
      },
      scope: {
        flowid: newRunState.flowId,
        runid: newRunState.runId,
        source: "lowercase://engine",
      },
      traceId: newRunState.traceId,
    } satisfies EmitFlowFailedFx);
  }

  return effects;
};
