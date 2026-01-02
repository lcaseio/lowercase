import {
  Planner,
  EngineEffect,
  EngineState,
  FlowSubmittedMsg,
  EmitRunStartedFx,
} from "../engine.types.js";

export const flowSubmittedPlanner: Planner<FlowSubmittedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: FlowSubmittedMsg
): EngineEffect[] | void => {
  const runId = message.event.runid;
  const newRunState = newState.runs[runId];

  const effects: EngineEffect[] = [];

  if (!newRunState) return effects;
  if (newRunState.status !== "started") return effects;

  effects.push({
    type: "EmitRunStarted",
    eventType: "run.started",
    data: null,
    scope: {
      flowid: newRunState.flowId,
      runid: newRunState.runId,
      source: "lowercase://engine",
    },
    traceId: newRunState.traceId,
  } satisfies EmitRunStartedFx);

  return effects;
};
