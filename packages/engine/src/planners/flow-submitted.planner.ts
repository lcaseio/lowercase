import {
  Planner,
  EngineEffect,
  EngineState,
  FlowSubmittedMsg,
  EmitRunStartedFx,
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
  message: FlowSubmittedMsg
): EngineEffect[] => {
  const runId = message.event.runid;
  const newRunState = newState.runs[runId];
  const oldRunState = oldState.runs[runId];

  const effects: EngineEffect[] = [];

  if (!newRunState) return effects;
  if (newRunState.status !== "started") return effects;
  if (oldRunState !== undefined) return effects;

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
