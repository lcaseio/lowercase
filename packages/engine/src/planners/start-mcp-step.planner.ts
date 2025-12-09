import type { StepMcp } from "@lcase/types";
import type {
  EmitJobMcpSubmittedFx,
  EngineEffect,
  EngineState,
  Planner,
  StartMcpStepMsg,
} from "../engine.types.js";

export const starMcpStepPlanner: Planner<StartMcpStepMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: StartMcpStepMsg;
}): EngineEffect[] | void => {
  const { message, newState } = args;
  const { runId, stepId } = message;
  const step = newState.runs[message.runId].definition.steps[
    message.stepId
  ] as StepMcp;

  const runCtx = { ...newState.runs[runId] };
  const stepCtx = { ...runCtx.steps[stepId] };
  return [
    {
      kind: "EmitJobMcpSubmittedEvent",
      data: {
        job: {
          capid: step.type,
          id: "",
          toolid: step.tool ?? null,
        },
        url: step.url,
        feature: step.feature,
        transport: step.transport,
        ...(stepCtx.args ? { args: stepCtx.args } : {}),
        ...(step.tool ? { tool: step.tool } : {}),
      },
      eventType: "job.mcp.submitted",
      traceId: newState.runs[runId].traceId,
      scope: {
        capid: step.type,
        flowid: newState.runs[runId].flowId,
        jobid: "",
        runid: runId,
        stepid: stepId,
        source: "lowercase://engine",
        toolid: step.tool ?? null,
      },
    } satisfies EmitJobMcpSubmittedFx,
  ];
};
