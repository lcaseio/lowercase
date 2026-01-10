import type {
  EmitJobHttpJsonSubmittedFx,
  EmitStepStartedFx,
  EngineEffect,
  EngineState,
  Planner,
} from "../engine.types.js";
import type { StepStartedMsg } from "../types/message.types.js";

export const stepStartedPlanner: Planner<StepStartedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: StepStartedMsg
) => {
  const effects: EngineEffect[] = [];
  const runId = message.event.runid;
  const flowId = message.event.flowid;
  const stepId = message.event.stepid;

  const newRunState = newState.runs[runId];

  if (!newRunState) return;
  const flowDef = newState.flows[flowId];
  if (!flowDef) return;

  const stepDef = flowDef.definition.steps[stepId];
  if (!stepDef) return;

  const emitStepStarted: EmitStepStartedFx = {
    type: "EmitStepStarted",
    scope: {
      flowid: flowId,
      runid: runId,
      stepid: stepId,
      steptype: stepDef.type,
      source: "lowercase://engine",
    },
    data: {
      status: "started",
      step: {
        id: stepId,
        name: stepId,
        type: stepDef.type,
      },
    },
    traceId: newRunState.traceId,
  };
  effects.push(emitStepStarted);

  // could look up by function and return the correct data structure
  // could keep it generic, but how

  const job: EmitJobHttpJsonSubmittedFx = {
    type: "EmitJobHttpjsonSubmittedEvent",
    data: {},
  };

  return effects;
};
