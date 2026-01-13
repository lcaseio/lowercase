import type {
  EmitStepPlannedFx,
  EngineEffect,
  EngineState,
  Planner,
  RunStartedMsg,
  WriteContextToDiskFx,
} from "../engine.types.js";

/**
 * Plans an EmitStepPlanned effect if the status of the start step
 * changes from "initialized" to "pending".
 * @param oldState EngineState
 * @param newState EngineState
 * @param message RunStartedMsg
 * @returns EngineEffect[]
 */
export const runStartedPlanner: Planner<RunStartedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: RunStartedMsg
): EngineEffect[] => {
  const effects: EngineEffect[] = [];

  const runId = message.event.runid;
  const flowId = message.event.flowid;

  const oldFlow = oldState.flows[flowId];
  const oldRun = oldState.runs[runId];
  const newRun = newState.runs[runId];
  const newFlow = newState.flows[flowId];

  if (!newRun) return effects;
  if (!newFlow) return effects;

  const def = newFlow.definition;
  const newStepId = def.start;
  const newStep = newRun.steps[newStepId];
  if (!newStep) return effects;

  const oldStepId = oldFlow.definition.start;
  const oldStep = oldRun.steps[oldStepId];
  if (!oldStep) return effects;

  if (oldStep.status !== "initialized" || newStep.status !== "planned") {
    return effects;
  }
  if (oldRun.plannedSteps[oldStepId] !== undefined) return effects;
  if (newRun.plannedSteps[newStepId] === undefined) return effects;

  effects.push({
    type: "EmitStepPlanned",
    scope: {
      flowid: message.event.flowid,
      runid: message.event.runid,
      source: "lowercase://engine",
      stepid: newStepId,
      steptype: newFlow.definition.steps[newStepId].type,
    },
    data: {
      step: {
        id: newStepId,
        name: newStepId,
        type: newFlow.definition.steps[newStepId].type,
      },
    },
    traceId: message.event.traceid,
  } satisfies EmitStepPlannedFx);

  const writeEffect = {
    type: "WriteContextToDisk",
    context: newRun,
    runId,
  } satisfies WriteContextToDiskFx;
  effects.push(writeEffect);

  return effects;
};
