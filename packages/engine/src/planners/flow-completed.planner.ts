import type {
  Planner,
  EngineEffect,
  EngineState,
  EmitFlowCompletedFx,
  FlowCompletedMsg,
} from "../engine.types.js";

export const flowCompletedPlanner: Planner<FlowCompletedMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: FlowCompletedMsg;
}): EngineEffect[] | void => {
  const { newState, message } = args;
  const { runId, stepId } = message;
  const flowId = newState.runs[runId].flowId;
  const effects: EngineEffect[] = [];

  const newRunState = newState.runs[message.runId];
  if (!newRunState) return;

  if (newRunState.status !== "completed") return;

  const effect = {
    kind: "EmitFlowCompleted",
    data: {
      flow: {
        id: flowId,
        name: newState.runs[runId].flowName,
        version: newState.runs[runId].definition.version,
      },
      status: "success",
    },
    eventType: "flow.completed",
    scope: {
      flowid: flowId,
      source: "lowercase://engine",
    },
    traceId: newState.runs[runId].traceId,
  } satisfies EmitFlowCompletedFx;
  effects.push(effect);

  return effects;
};
