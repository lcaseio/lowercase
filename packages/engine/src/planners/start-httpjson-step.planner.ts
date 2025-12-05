import { StepHttpJson } from "@lcase/types";
import {
  EngineEffect,
  EngineState,
  Planner,
  StartHttjsonStepMsg,
} from "../engine.js";

export const startHttpjsonStepPlanner: Planner<StartHttjsonStepMsg> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: StartHttjsonStepMsg;
}): EngineEffect[] | void => {
  const { message, newState } = args;
  const { runId, stepId } = message;
  const step = newState.runs[message.runId].definition.steps[
    message.stepId
  ] as StepHttpJson;
  return [
    {
      kind: "EmitJobHttpjsonSubmittedEvent",
      data: {
        job: {
          capid: "httpjson",
          id: "",
          toolid: null,
        },
        url: step.url,
        ...(step.body ? { body: step.body } : {}),
        ...(step.headers ? { headers: step.headers } : {}),
        ...(step.method ? { method: step.method } : {}),
      },
      eventType: "job.httpjson.submitted",
      traceId: newState.runs[runId].traceId,
      scope: {
        capid: "httpjson",
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
