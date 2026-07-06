import { JobFailedEvent } from "@lcase/types";
import type {
  Planner,
  EngineEffect,
  EngineState,
  JobCompletedMsg,
  EmitStepCompletedFx,
  JobFinishedMsg,
  EmitStepFailedFx,
  WriteContextToDiskFx,
} from "../engine.types.js";

export const jobFinishedPlanner: Planner<JobFinishedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: JobFinishedMsg,
): EngineEffect[] => {
  const effects: EngineEffect[] = [];
  const runId = message.event.runid;
  const stepId = message.event.stepid;

  const newRunState = newState.runs[runId];

  if (!newRunState) return effects;

  const flow = newState.flows[newRunState.flowVersionId];
  if (!flow) return effects;
  const step = flow.definition.steps[stepId];
  if (!step) return effects;
  const stepCtx = newRunState.steps[stepId];

  if (stepCtx.status === "completed") {
    const emitStepCompletedFx: EmitStepCompletedFx = {
      type: "EmitStepCompleted",
      scope: {
        flowid: newState.runs[runId].flowId,
        flowversionid: newState.runs[runId].flowVersionId,
        runid: runId,
        source: "lowercase://engine",
        stepid: stepId,
        steptype: flow.definition.steps[stepId].type,
      },
      data: {
        status: "success",
        outputHash: newRunState.steps[stepId].outputHash ?? undefined,
        exportHashes:
          Object.keys(newRunState.steps[stepId].exportHashes).length > 0
            ? newRunState.steps[stepId].exportHashes
            : undefined,
        step: {
          id: stepId,
          name: stepId,
          type: flow.definition.steps[stepId].type,
        },
      },
      traceId: newRunState.traceId,
    };
    effects.push(emitStepCompletedFx);
  } else if (stepCtx.status === "failed") {
    if (message.event.data.status !== "failure") return effects;
    const e = message.event as JobFailedEvent;

    const emitStepFailedFx: EmitStepFailedFx = {
      type: "EmitStepFailed",
      scope: {
        flowid: newState.runs[runId].flowId,
        flowversionid: newState.runs[runId].flowVersionId,
        runid: runId,
        source: "lowercase://engine",
        stepid: stepId,
        steptype: flow.definition.steps[stepId].type,
      },
      data: {
        reason: e.data.message ?? "",
        status: e.data.status,
        outputHash: newRunState.steps[stepId].outputHash ?? undefined,
        exportHashes:
          Object.keys(newRunState.steps[stepId].exportHashes).length > 0
            ? newRunState.steps[stepId].exportHashes
            : undefined,
        step: {
          id: stepId,
          name: stepId,
          type: flow.definition.steps[stepId].type,
        },
      },
      traceId: newRunState.traceId,
    };
    effects.push(emitStepFailedFx);
  }

  return effects;
};
