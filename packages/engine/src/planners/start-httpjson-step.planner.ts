import { StepHttpJson } from "@lcase/types";
import {
  EngineEffect,
  EngineState,
  Planner,
  StartHttpJsonStepMsg,
} from "../engine.types.js";

export const startHttpJsonStepPlanner: Planner<StartHttpJsonStepMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: StartHttpJsonStepMsg;
}): EngineEffect[] | void => {
  const { message, newState } = args;
  const { runId, stepId } = message;
  const step = newState.runs[message.runId].definition.steps[
    message.stepId
  ] as StepHttpJson;

  const resolveUrl = newState.runs[runId].steps[stepId].resolved.url;

  const url =
    resolveUrl && typeof resolveUrl === "string" ? resolveUrl : step.url;

  return [
    {
      kind: "EmitJobHttpjsonSubmittedEvent",
      data: {
        job: {
          capid: step.type,
          id: "",
          toolid: null,
        },
        url,
        ...(step.body ? { body: step.body } : {}),
        ...(step.headers ? { headers: step.headers } : {}),
        ...(step.method ? { method: step.method } : {}),
      },
      eventType: "job.httpjson.submitted",
      traceId: newState.runs[runId].traceId,
      scope: {
        capid: step.type,
        flowid: newState.runs[runId].flowId,
        jobid: "",
        runid: runId,
        stepid: stepId,
        source: "lowercase://engine",
        toolid: null,
      },
    },
  ];
};
