import type { StepHttpJson, StepMcp } from "@lcase/types";
import type {
  EmitJobHttpJsonSubmittedFx,
  EmitJobMcpSubmittedFx,
  EmitStepStartedFx,
  EngineEffect,
  EngineState,
  Planner,
} from "../engine.types.js";
import type { StepPlannedMsg } from "../types/message.types.js";

import { bindStepRefs } from "../references/bind.js";

export const stepPlannedPlanner: Planner<StepPlannedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: StepPlannedMsg
): EngineEffect[] => {
  const effects: EngineEffect[] = [];

  const runId = message.event.runid;
  const flowId = message.event.flowid;
  const stepId = message.event.stepid;
  const stepType = message.event.steptype;

  const newRun = newState.runs[runId];
  const flow = newState.flows[flowId];
  const step = flow.definition.steps[stepId];
  const refs = newRun.flowAnalysis.refs.filter((ref) => ref.stepId === stepId);

  if (!newRun) return effects;
  if (!flow) return effects;
  if (!step) return effects;

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
    const materializedStep = bindStepRefs(
      refs,
      newRun.steps[stepId].resolved,
      step as StepHttpJson
    );
    const emitJob: EmitJobHttpJsonSubmittedFx = {
      type: "EmitJobHttpJsonSubmitted",
      scope: {
        flowid: flowId,
        runid: runId,
        stepid: stepId,
        capid: "httpjson",
        toolid: "httpjson",
      },
      data: {
        url: materializedStep.url,
        body: materializedStep.body,
        headers: materializedStep.headers,
        method: materializedStep.method,
        args: materializedStep.args,
      },
      traceId: newRun.traceId,
    };
    effects.push(emitJob);
  } else if (stepType === "mcp") {
    const materializedStep = bindStepRefs(
      refs,
      newRun.steps[stepId].resolved,
      step as StepMcp
    );
    const emitJob: EmitJobMcpSubmittedFx = {
      type: "EmitJobMcpSubmitted",
      scope: {
        flowid: flowId,
        capid: "mcp",
        runid: runId,
        stepid: stepId,
        toolid: "mcp",
      },
      data: { ...materializedStep },
      traceId: newRun.traceId,
    };
    effects.push(emitJob);
  }

  return effects;
};
