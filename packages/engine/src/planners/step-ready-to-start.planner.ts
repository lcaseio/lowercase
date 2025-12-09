import type {
  DispatchInternalFx,
  EmitStepStartedFx,
  EngineEffect,
  EngineMessage,
  EngineState,
  Planner,
  StartHttpJsonStepMsg,
  StartJoinMsg,
  StartMcpStepMsg,
  StartParallelMsg,
  StepReadyToStartMsg,
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
  const run = newState.runs[runId];
  const stepType = newState.runs[runId].definition.steps[stepId].type;

  const effects: EngineEffect[] = [];

  if (stepType === "join") return;
  const msgMaker = stepTypeMap[stepType] ?? undefined;
  if (!msgMaker) return;

  const stepMessage = msgMaker(message);
  if (!stepMessage) return;

  const stepCtx = run.steps[stepId];

  if (stepCtx.joins.size > 0) {
    for (const joinStep of stepCtx.joins.values()) {
      if (run.steps[joinStep].status === "pending") {
        const effect = {
          kind: "DispatchInternal",
          message: {
            type: "StartJoin",
            runId,
            stepId,
            joinStepId: joinStep,
          } satisfies StartJoinMsg,
        } satisfies DispatchInternalFx;
        effects.push(effect);
      }
    }
  }

  const stepStartedEffect = {
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
  } satisfies EmitStepStartedFx;

  effects.push(stepStartedEffect);

  const dispatchInternal = {
    kind: "DispatchInternal",
    message: stepMessage,
  } satisfies DispatchInternalFx;

  effects.push(dispatchInternal);

  return effects;
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
