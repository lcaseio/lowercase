import type {
  EngineEffect,
  EngineMessage,
  EngineState,
  Planner,
  StartHttpJsonStepMsg,
  StartMcpStepMsg,
  StartParallelMsg,
  StepReadyToStartMsg,
  UpdateJoinMsg,
} from "../engine.types.js";

export const stepTypeMap = {
  httpjson: httpJsonStartMsg,
  mcp: mcpStartMsg,
  parallel: parallelStartMsg,
} satisfies StepMsgMap;

export const stepReadyToStartPlanner: Planner<StepReadyToStartMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: StepReadyToStartMsg;
}): EngineEffect[] | void => {
  const { newState, message } = args;
  const { runId, stepId } = message;
  const stepType = newState.runs[runId].definition.steps[stepId].type;

  if (stepType === "join") return;
  const msgMaker = stepTypeMap[stepType] ?? undefined;
  if (!msgMaker) return;

  const stepMessage = msgMaker(message);
  if (!stepMessage) return;

  return [
    {
      kind: "EmitStepStarted",
      data: {
        status: "started",
        step: {
          id: stepId,
          name: stepId,
          type: newState.runs[runId].definition.steps[stepId].type,
        },
      },
      eventType: "step.started",
      scope: {
        flowid: newState.runs[runId].flowId,
        runid: runId,
        source: "lowercase://engine",
        stepid: stepId,
        steptype: newState.runs[runId].definition.steps[stepId].type,
      },
      traceId: newState.runs[runId].traceId,
    },
    {
      kind: "DispatchInternal",
      message: stepMessage,
    },
  ];
};

export function httpJsonStartMsg(
  message: StepReadyToStartMsg
): StartHttpJsonStepMsg {
  return {
    type: "StartHttpjsonStep",
    runId: message.runId,
    stepId: message.stepId,
  };
}

export function mcpStartMsg(message: StepReadyToStartMsg): StartMcpStepMsg {
  return {
    type: "StartMcpStep",
    runId: message.runId,
    stepId: message.stepId,
  };
}

export function parallelStartMsg(
  message: StepReadyToStartMsg
): StartParallelMsg {
  return {
    type: "StartParallel",
    runId: message.runId,
    stepId: message.stepId,
  };
}

export type StepMsgMap = {
  [I in string]?: (message: StepReadyToStartMsg) => EngineMessage | void;
};
