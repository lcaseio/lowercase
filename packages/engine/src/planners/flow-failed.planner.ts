import type {
  Planner,
  EngineEffect,
  EngineState,
  DispatchInternalFx,
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

  if (newRunState.steps[stepId].status !== "failed") return;

  const nextStepId = newRunState.definition.steps[stepId].on?.failure;

  if (nextStepId) {
    const effect = {
      kind: "DispatchInternal",
      message: {
        type: "StepReadyToStart",
        stepId: nextStepId,
        runId,
      },
    } satisfies DispatchInternalFx;
    effects.push(effect);
  } else if (
    newRunState.outstandingSteps === 0 &&
    newRunState.runningSteps.size === 0
  ) {
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
  }

  return effects;
};
