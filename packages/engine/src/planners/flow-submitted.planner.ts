import {
  Planner,
  EngineEffect,
  EngineState,
  FlowSubmittedMsg,
} from "../engine.types.js";

export const flowSubmittedPlanner: Planner<FlowSubmittedMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: FlowSubmittedMsg;
}): EngineEffect[] | void => {
  const { newState, message } = args;

  const effects: EngineEffect[] = [];

  const newRunState = newState.runs[message.runId];
  if (!newRunState) return;

  if (newRunState.status === "pending") {
    effects.push({
      kind: "EmitFlowStartedEvent",
      eventType: "flow.started",
      data: {
        flow: {
          id: message.flowId,
          name: message.definition.name,
          version: message.definition.version,
        },
        run: { id: message.runId },
      },
      scope: { flowid: message.flowId, source: "lowercase://engine" },
      traceId: message.meta.traceId,
    });
    effects.push({
      kind: "DispatchInternal",
      message: {
        type: "StepReadyToStart",
        runId: message.runId,
        stepId: message.definition.start,
      },
    });
  }

  return effects;
};
