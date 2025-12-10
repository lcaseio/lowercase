import type {
  Planner,
  EngineEffect,
  EngineState,
  FlowFailedMsg,
  EmitFlowFailedFx,
} from "../engine.types.js";

export const flowFailedPlanner: Planner<FlowFailedMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: FlowFailedMsg;
}): EngineEffect[] | void => {
  const { newState, message } = args;
  const { runId, stepId } = message;
  const flowId = newState.runs[runId].flowId;
  const effects: EngineEffect[] = [];

  const newRunState = newState.runs[message.runId];
  if (!newRunState) return;

  if (newRunState.status !== "failed") return;

  const effect = {
    kind: "EmitFlowFailed",
    data: {
      flow: {
        id: flowId,
        name: newState.runs[runId].flowName,
        version: newState.runs[runId].definition.version,
      },
      status: "failure",
    },
    eventType: "flow.failed",
    scope: {
      flowid: flowId,
      source: "lowercase://engine",
    },
    traceId: newState.runs[runId].traceId,
  } satisfies EmitFlowFailedFx;
  effects.push(effect);

  return effects;
};
