import {
  EffectPlanner,
  EngineEffect,
  EngineState,
  FlowSubmittedMessage,
} from "../engine.js";

export const flowSubmittedPlanner: EffectPlanner<
  FlowSubmittedMessage
> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: FlowSubmittedMessage;
}): EngineEffect[] | void => {
  const { newState, message } = args;

  const effects: EngineEffect[] = [];

  const newRunState = newState.runs[message.runId];
  if (!newRunState) return;

  if (newRunState.status === "pending") {
    effects.push({
      kind: "EmitEvent",
      eventType: "flow.started",
      payload: {
        runId: message.runId,
        traceId: message.meta.traceId,
      },
    });
    effects.push({
      kind: "DispatchInternal",
      message: {
        type: "StartStep",
        runId: message.runId,
        stepId: message.definition.start,
      },
    });
  }

  return effects;
};
