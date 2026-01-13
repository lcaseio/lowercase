import type {
  Planner,
  EngineEffect,
  EngineState,
  EmitFlowCompletedFx,
  WriteContextToDiskFx,
  RunFinishedMsg,
  EmitFlowFailedFx,
} from "../engine.types.js";

export const runFinishedPlanner: Planner<RunFinishedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: RunFinishedMsg
): EngineEffect[] => {
  const effects: EngineEffect[] = [];
  const runId = message.event.runid;

  const flowId = newState.runs[runId].flowId;
  const flow = newState.flows[flowId];

  const newRunState = newState.runs[runId];
  if (!newRunState || !flow) return effects;

  if (newRunState.status === "completed") {
    const effect = {
      type: "EmitFlowCompleted",
      data: {
        flow: {
          id: flowId,
          name: flow.definition.name,
          version: flow.definition.version,
        },
        run: { id: runId },
        status: "success",
      },
      scope: {
        flowid: flowId,
        runid: runId,
        source: "lowercase://engine",
      },
      traceId: newState.runs[runId].traceId,
    } satisfies EmitFlowCompletedFx;
    effects.push(effect);
  } else if (newRunState.status === "failed") {
    const effect: EmitFlowFailedFx = {
      type: "EmitFlowFailed",
      data: {
        flow: {
          id: flowId,
          name: flow.definition.name,
          version: flow.definition.version,
        },
        run: { id: runId },
        status: "failure",
      },
      scope: {
        flowid: flowId,
        runid: runId,
        source: "lowercase://engine",
      },
      traceId: newState.runs[runId].traceId,
    };
    effects.push(effect);
  }

  const writeEffect = {
    type: "WriteContextToDisk",
    context: newRunState,
    runId,
  } satisfies WriteContextToDiskFx;
  effects.push(writeEffect);

  return effects;
};
