import type {
  DispatchInternalFx,
  EngineEffect,
  EngineMessage,
  EngineState,
  Planner,
  StartHttjsonStepMsg,
  StepReadyToStartMsg,
} from "../engine.js";

export const stepTypeMap = {
  httpjson: httpjsonStartMsg,
  mcp: httpjsonStartMsg,
} satisfies StepMsgMap;

export const stepReadyToStartPlanner: Planner<StepReadyToStartMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: StepReadyToStartMsg;
}): DispatchInternalFx[] | void => {
  const { newState, message } = args;
  const { runId, stepId } = message;

  const stepType = newState.runs[runId].definition.steps[stepId].type;

  const msgMaker = stepTypeMap[stepType] ?? undefined;
  if (!msgMaker) return;

  const stepMessage = msgMaker(message);
  if (!stepMessage) return;

  return [
    {
      kind: "DispatchInternal",
      message: stepMessage,
    },
  ];
};

export function httpjsonStartMsg(
  message: StepReadyToStartMsg
): StartHttjsonStepMsg {
  return {
    type: "StartHttpjsonStep",
    runId: message.runId,
    stepId: message.stepId,
  };
}

export type StepMsgMap = {
  [I in string]?: (message: StepReadyToStartMsg) => EngineMessage | void;
};
