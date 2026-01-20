import type {
  EmitJobHttpJsonSubmittedFx,
  EmitJobMcpSubmittedFx,
  EmitStepStartedFx,
  EngineEffect,
  EngineState,
  Planner,
  WriteContextToDiskFx,
} from "../engine.types.js";
import type { StepPlannedMsg } from "../types/message.types.js";
import { makeStepRefs } from "../references/value-refs.js";

export const stepPlannedPlanner: Planner<StepPlannedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: StepPlannedMsg,
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

  /**
   * no longer materialize steps here, worker resolves json to values using CAS.
   */
  if (stepType === "httpjson" && step.type === "httpjson") {
    // const materializedStep = bindStepRefs(
    //   refs,
    //   newRun.steps[stepId].resolved,
    //   step as StepHttpJson
    // );

    const jobRefs = makeStepRefs(
      stepId,
      newRun.flowAnalysis.refs,
      newRun.steps,
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
        url: step.url,
        ...(step.body ? { body: step.body } : {}),
        ...(step.headers ? { headers: step.headers } : {}),
        ...(step.method ? { method: step.method } : {}),
        ...(step.args ? { args: step.args } : {}),
        refs: jobRefs,
      },
      traceId: newRun.traceId,
    };
    effects.push(emitJob);
  } else if (stepType === "mcp" && step.type === "mcp") {
    // const materializedStep = bindStepRefs(
    //   refs,
    //   newRun.steps[stepId].resolved,
    //   step as StepMcp
    // );
    const jobRefs = makeStepRefs(
      stepId,
      newRun.flowAnalysis.refs,
      newRun.steps,
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
      data: {
        url: step.url,
        feature: step.feature,
        transport: step.transport,
        ...(step.args ? { args: step.args } : {}),
        refs: jobRefs,
      },
      traceId: newRun.traceId,
    };
    effects.push(emitJob);
  }

  return effects;
};
