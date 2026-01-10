import {
  Ref,
  StepDefinition,
  StepHttpJson,
  StepJoin,
  StepMcp,
} from "@lcase/types";
import type {
  EmitJobHttpJsonSubmittedFx,
  EmitJobMcpSubmittedFx,
  EmitJoinStepStartedFx,
  EmitStepStartedFx,
  EngineEffect,
  EngineState,
  Planner,
} from "../engine.types.js";
import type { StepPlannedMsg } from "../types/message.types.js";
import { StepContext } from "@lcase/types/engine";

export const stepPlannedPlanner: Planner<StepPlannedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: StepPlannedMsg
) => {
  const effects: EngineEffect[] = [];

  const runId = message.event.runid;
  const flowId = message.event.flowid;
  const stepId = message.event.stepid;
  const stepType = message.event.steptype;

  const newRun = newState.runs[runId];
  const flow = newState.flows[flowId];
  const step = flow.definition.steps[stepId];

  if (!newRun) return;
  if (!flow) return;
  if (!step) return;

  const emitStepStarted: EmitStepStartedFx = {
    type: "EmitStepStarted",
    scope: {
      flowid: flowId,
      runid: runId,
      stepid: stepId,
      steptype: stepType,
      source: "lowercase://engine",
    },
    data: {
      status: "started",
      step: {
        id: stepId,
        name: stepId,
        type: stepType,
      },
    },
    traceId: newRun.traceId,
  };
  effects.push(emitStepStarted);

  if (stepType === "httpjson") {
    const httpJsonStep = step as StepHttpJson;
    const emitJob: EmitJobHttpJsonSubmittedFx = {
      type: "EmitJobHttpJsonSubmitted",
      scope: {
        flowid: flowId,
        runid: runId,
        stepid: stepId,
        capid: "httpjson",
        toolid: "httpjson",
      },
      data: { ...httpJsonStep },
      traceId: newRun.traceId,
    };
    effects.push(emitJob);
  } else if (stepType === "mcp") {
    const mcpStep = step as StepMcp;
    const emitJob: EmitJobMcpSubmittedFx = {
      type: "EmitJobMcpSubmittedEvent",
      scope: {
        flowid: flowId,
        capid: "mcp",
        runid: runId,
        stepid: stepId,
        toolid: "mcp",
      },
      data: { ...mcpStep },
      traceId: newRun.traceId,
    };
  }

  // see if old state was planned
  // see if new state is started
  // form step.started effect
  // form job.started effect
  //

  return effects;
};

// export const startedEffectGenerators: StartedEffectRegistry = {};

export type StartedEffectRegistry = Record<
  StepDefinition["type"],
  () => EngineEffect[]
>;

function joinStartedGenerator(
  step: StepJoin,
  context: StepContext,
  refs: Ref[] = []
) {}
