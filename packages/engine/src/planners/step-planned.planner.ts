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
import { EmitStepReusedFx } from "../types/effect.types.js";

export const stepPlannedPlanner: Planner<StepPlannedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: StepPlannedMsg,
): EngineEffect[] => {
  const effects: EngineEffect[] = [];

  const runId = message.event.runid;
  const stepId = message.event.stepid;
  const stepType = message.event.steptype;

  const newRun = newState.runs[runId];
  if (!newRun) return effects;
  const flow = newState.flows[newRun.flowVersionId];
  if (!flow) return effects;
  const step = flow.definition.steps[stepId];
  if (!step) return effects;

  // emit step.reused instead of step.started if reused by run plan
  if (newRun.runPlan.reuse[stepId]) {
    const status =
      newRun.steps[stepId].status === "completed" ? "success" : "failure";
    const emitStepReused: EmitStepReusedFx = {
      type: "EmitStepReused",
      scope: {
        flowid: newRun.flowId,
        flowversionid: newRun.flowVersionId,
        runid: runId,
        stepid: stepId,
        steptype: stepType,
        source: "lowercase://engine",
      },
      data: {
        status,
        outputHash: newRun.steps[stepId].outputHash ?? undefined,
        exportHashes:
          Object.keys(newRun.steps[stepId].exportHashes).length > 0
            ? newRun.steps[stepId].exportHashes
            : undefined,
        sourceRunId: newRun.forkSpec?.parentRunId ?? "",
      },
      traceId: message.event.traceid,
    };
    effects.push(emitStepReused);
    return effects;
  }

  const emitStepStarted: EmitStepStartedFx = {
    type: "EmitStepStarted",
    scope: {
      flowid: newRun.flowId,
      flowversionid: newRun.flowVersionId,
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
    const jobRefs = makeStepRefs(
      stepId,
      newRun.flowAnalysis.refs,
      newRun.steps,
      newRun.params,
      flow.definition.params,
    );
    const exportRefs = newRun.flowAnalysis.exportRefsByStep?.[stepId] ?? {};
    const emitJob: EmitJobHttpJsonSubmittedFx = {
      type: "EmitJobHttpJsonSubmitted",
      scope: {
        flowid: newRun.flowId,
        flowversionid: newRun.flowVersionId,
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
        ...(Object.keys(exportRefs).length > 0 ? { exportRefs } : {}),
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
      newRun.params,
      flow.definition.params,
    );
    const emitJob: EmitJobMcpSubmittedFx = {
      type: "EmitJobMcpSubmitted",
      scope: {
        flowid: newRun.flowId,
        flowversionid: newRun.flowVersionId,
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
